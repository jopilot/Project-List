import React, { useState, useRef, useEffect } from 'react';
// Lucide React에서 채팅 창에 어울리는 풍부한 아이콘들을 불러옵니다.
import { Send, Bot, User, Sparkles, Key, Loader } from 'lucide-react';
// @google/genai SDK 임포트
import { GoogleGenAI } from '@google/genai';
// 공통 데이터 타입 불러오기
import { Message, Project } from '../types';

// 컴포넌트 Props 타입 정의
interface AIAssistantChatProps {
  apiKey: string;                            // 구글 Gemini AI 호출에 사용할 API Key
  projects: Project[];                       // AI가 컨텍스트로 읽을 실시간 프로젝트 목록 데이터
}

export const AIAssistantChat: React.FC<AIAssistantChatProps> = ({
  apiKey,
  projects,
}) => {
  // 메시지 입력을 담당할 로컬 상태
  const [inputText, setInputText] = useState<string>('');
  // 대화 기록 리스트를 관리할 상태 (최초 진입 시 AI의 웰컴 메시지를 삽입)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '안녕하세요! 글로벌 프로젝트 AI 컨설턴트입니다. 📊\n\n현재 업로드된 프로젝트 데이터를 완벽히 인지하여 국가별 수주 리스크, 산업 분야별 비중 분석, 투자 동향 등을 정밀 상담해드리고 있습니다.\n\n분석이 필요한 특정 프로젝트나 통계적 궁금증이 있으시다면 언제든 질문해주시거나 하단의 추천 질문을 클릭해보세요!',
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }),
    },
  ]);
  // API 로딩 상태를 나타내는 로컬 상태
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 채팅 창이 스크롤 하단에 머물도록 관리하기 위한 ref 참조
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 새로운 메시지가 추가되거나 로딩 상태가 변할 때 채팅창을 가장 아래로 스크롤합니다.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // 빠른 질문 템플릿 정의 (유저 편의성 극대화)
  const QUICK_PROMPTS = [
    '가장 규모(Amount)가 큰 주요 프로젝트 탑 3를 요약해줘',
    '중동 및 아시아 지역의 주요 프로젝트 수주 동향을 분석해줘',
    '산업군(Industry)별 프로젝트 분포 현황과 주요 특징을 말해줘',
  ];

  // 메시지 전송 로직의 핵심 함수
  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !apiKey || isLoading) return;

    // 1. 유저 메시지를 화면 대화창에 즉시 추가
    const userTimestamp = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    const userMessageId = Math.random().toString(36).substring(7);
    const userMsg: Message = {
      id: userMessageId,
      sender: 'user',
      text: textToSend,
      timestamp: userTimestamp,
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // 2. @google/genai SDK의 GoogleGenAI 인스턴스화
      const ai = new GoogleGenAI({ apiKey: apiKey });

      // 3. 프로젝트 데이터를 AI가 맥락을 쉽게 짚을 수 있도록 콤팩트한 텍스트 리스트로 직렬화합니다.
      const formattedProjects = projects.map((p, idx) => ({
        순번: idx + 1,
        산업분야: p.industry,
        지역: p.region,
        국가: p.country,
        프로젝트명: p.projectName,
        발주처: p.client,
        금액: p.amount,
        시공사: p.epcContractor,
        계약일자: p.awardedDate,
        용량: p.capacity
      }));

      // 4. Gemini AI에 전달할 시스템 인스트럭션/페르소나 설계
      // - 수집된 프로젝트 리스트의 실시간 현황을 AI에게 주입합니다.
      const systemInstruction = `당신은 전 세계 다양한 산업군 및 인프라 프로젝트 데이터베이스를 분석하는 수석 프로젝트 분석 컨설턴트(AI Project Advisor)입니다.
사용자가 관리하는 실시간 프로젝트 리스트 데이터를 학습 및 대조하여, 질문에 대한 객관적이고 데이터 기반의 인사이트를 정중하고 친절하게 답변해주세요.

답변할 때 아래의 규칙을 엄격히 준수하세요:
1. 사용자가 질문할 때 항상 [현재 사용자의 프로젝트 데이터베이스 정보]에 나열된 세부 데이터를 적극 활용하여 구체적으로 근거를 들어 설명하십시오.
2. 특정 지역(예: 중동)이나 특정 분야(예: 담수&발전)에 데이터가 쏠려 있는 등, 수주 리스크 및 시장 편중도가 보인다면 대안 시장(유럽, 미주 등)으로의 진출 조언과 EPC 기술 확보 방향 등 깊이 있는 전문 제언도 덧붙여주세요.
3. 화폐 단위(예: €, ₩, $, KRW)가 명시되어 있는 경우, 절대로 단위를 생략하지 말고 금액을 원문 그대로 존중하여 정확하게 비교/분석하십시오.
4. 존댓말을 사용하여 매우 정중하고 신뢰감 있는 비즈니스 어조로 답변해주세요.
5. 마크다운 형식(볼드체, 글머리 기호, 테이블 형식 등)을 적극 사용하여 가독성 높은 보고서 형태로 답변을 구조화해주세요.

[현재 사용자의 프로젝트 데이터베이스 정보]
- 총 등록 프로젝트 수: ${projects.length}개
- 상세 프로젝트 목록 JSON:
${JSON.stringify(formattedProjects, null, 2)}
`;

      // 5. 이전 대화 기록 컨텍스트를 프롬프트에 매핑하여 멀티턴 대화 느낌을 연출합니다.
      // (컨텍스트 유지를 위해 최근 6개의 메시지만 추출)
      const recentMessages = messages.slice(-6).map(m => 
        `${m.sender === 'user' ? '사용자' : 'AI 컨설턴트'}: ${m.text}`
      ).join('\n');

      const fullPrompt = `${systemInstruction}\n\n[최근 상담 대화 내역]\n${recentMessages}\n\n사용자 최신 질문: ${textToSend}\n\nAI 컨설턴트의 정밀 비즈니스 답변:`;

      // 6. Gemini 3.5 Flash 모델 API 호출 (요구사항인 gemini-3-flash-preview 모델 사용)
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: fullPrompt,
      });

      // 7. API 응답 메시지 추출
      const aiReplyText = response.text || '죄송합니다. 프로젝트 데이터에 대한 유효한 분석 답변을 생성하지 못했습니다.';
      
      const aiTimestamp = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
      const aiMessageId = Math.random().toString(36).substring(7);

      // 8. AI 응답 대화창에 추가
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          sender: 'ai',
          text: aiReplyText,
          timestamp: aiTimestamp,
        },
      ]);
    } catch (error: any) {
      // 9. 예외 처리: 호출 에러 발생 시 사용자 친화적인 에러 메세지를 대화방에 노출합니다.
      console.error('Gemini API Error:', error);
      const errTimestamp = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
      
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'ai',
          text: `⚠️ **프로젝트 AI 분석기 연결에 실패했습니다.**\n\n- **원인:** 입력하신 Google Gemini API Key가 유효하지 않거나 일시적인 네트워크 트래픽 초과일 수 있습니다.\n- **해결 방법:** 상단의 설정 영역에서 API Key를 복사하여 다시 한 번 올바르게 입력해주시기 바랍니다.\n\n*(상세 에러 내용: ${error.message || 'Unknown Error'})*`,
          timestamp: errTimestamp,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 전송 폼 제출 이벤트 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-800 shadow-xl flex flex-col h-[650px] overflow-hidden">
      
      {/* 챗봇 헤더 영역 */}
      <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-brand-500/10 text-brand-400 rounded-lg">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100 tracking-wide uppercase">AI Project Consultant</h2>
            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
              실시간 데이터 연동 활성화
            </p>
          </div>
        </div>
      </div>

      {/* API Key 검증 분기 처리 */}
      {!apiKey ? (
        // API Key가 미등록된 경우 표시할 가이드 영역
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/20">
          <div className="p-4 bg-amber-500/10 text-amber-400 rounded-full mb-4 border border-amber-500/20">
            <Key className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-200 text-sm">Gemini API Key 미설정</h3>
          <p className="text-[11px] text-slate-400 mt-2 max-w-xs leading-relaxed">
            AI 컨설턴트 챗봇에게 실시간 프로젝트 통계 분석 및 인사이트 조언을 구하려면 화면 최상단 네비게이션의 <strong>Gemini API 설정</strong>을 완료해주세요.
          </p>
        </div>
      ) : (
        // API Key가 있을 때 활성화되는 실시간 대화창 영역
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/30">
          
          {/* 메시지 출력 영역 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div key={msg.id} className={`flex gap-3 ${isAi ? '' : 'flex-row-reverse'}`}>
                  {/* 프로필 아이콘 */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                    isAi ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
                  }`}>
                    {isAi ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                  </div>

                  {/* 말풍선 본문 */}
                  <div className="max-w-[80%] space-y-1">
                    <div className={`p-3.5 rounded-2xl text-[11px] leading-relaxed border ${
                      isAi
                        ? 'bg-slate-900/90 border-slate-800/80 text-slate-200 rounded-tl-none whitespace-pre-line'
                        : 'bg-brand-900/40 border-brand-500/20 text-slate-100 rounded-tr-none'
                    }`}>
                      {/* 단순 마크다운 볼드와 글머리 기호의 파싱 보완 처리 */}
                      {msg.text.split('\n').map((line, idx) => {
                        let parsedLine = line;
                        // 볼드 기호(**) 처리
                        if (parsedLine.includes('**')) {
                          const parts = parsedLine.split('**');
                          return (
                            <span key={idx} className="block mt-1">
                              {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-brand-300 font-bold">{part}</strong> : part)}
                            </span>
                          );
                        }
                        // 글머리 기호(-) 또는 (*) 처리
                        if (parsedLine.trim().startsWith('-') || parsedLine.trim().startsWith('•')) {
                          return (
                            <span key={idx} className="block pl-3 text-slate-300 mt-1 relative before:content-['•'] before:absolute before:left-0 before:text-brand-400">
                              {parsedLine.replace(/^\s*[-•]\s*/, '')}
                            </span>
                          );
                        }
                        return <span key={idx} className="block min-h-[0.5rem]">{parsedLine}</span>;
                      })}
                    </div>
                    {/* 전송 시간 표시 */}
                    <div className={`text-[9px] text-slate-500 font-mono ${isAi ? 'text-left' : 'text-right'}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI 타이핑 로딩 상태 */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center">
                  <Loader className="w-4 h-4 animate-spin" />
                </div>
                <div className="max-w-[75%] p-3.5 rounded-2xl rounded-tl-none bg-slate-900/90 border border-slate-800/80 text-slate-400 text-[11px] flex items-center gap-2">
                  <span>프로젝트 컨설턴트가 데이터를 분석하고 있습니다</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce delay-150"></span>
                    <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce delay-300"></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 추천 질문 (Quick Prompts) 영역 */}
          {messages.length < 5 && !isLoading && (
            <div className="px-4 py-2 border-t border-slate-900 bg-slate-900/20 flex flex-col gap-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">💡 분석 추천 질문</span>
              <div className="flex flex-col gap-1.5">
                {QUICK_PROMPTS.map((promptText, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendMessage(promptText)}
                    className="text-left text-[10px] text-slate-300 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700/80 py-1.5 px-3 rounded-lg transition-all truncate hover:text-brand-300"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 전송 입력 폼 영역 */}
          <form onSubmit={handleSubmit} className="p-3 bg-slate-900/50 border-t border-slate-900 flex gap-2 items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              placeholder="데이터 분석, 시장 예측, 시공사 리스크를 물어보세요..."
              className="flex-1 input-control rounded-xl py-2 px-3 text-xs focus:outline-none text-slate-200"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`p-2.5 rounded-xl transition-all ${
                inputText.trim() && !isLoading
                  ? 'btn-premium text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
      
    </div>
  );
};

