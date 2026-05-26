import React, { useState, useRef, useEffect } from 'react';
// Lucide React에서 채팅 창에 어울리는 풍부한 아이콘들을 불러옵니다.
import { Send, Bot, User, Sparkles, Key, Loader } from 'lucide-react';
// @google/genai SDK 임포트
import { GoogleGenAI } from '@google/genai';
// 공통 데이터 타입 불러오기
import { Message, Transaction } from '../types';

// 컴포넌트 Props 타입 정의
interface AIAssistantChatProps {
  apiKey: string;                            // 구글 Gemini AI 호출에 사용할 API Key
  transactions: Transaction[];               // AI가 컨텍스트로 읽을 포트폴리오 매매 내역 데이터
}

export const AIAssistantChat: React.FC<AIAssistantChatProps> = ({
  apiKey,
  transactions,
}) => {
  // 메시지 입력을 담당할 로컬 상태
  const [inputText, setInputText] = useState<string>('');
  // 대화 기록 리스트를 관리할 상태 (최초 진입 시 AI의 웰컴 메시지를 삽입)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '안녕하세요! 포트폴리오 AI 자산 관리사입니다. 📊\n\n현재 작성해 주신 주식 가계부 매매 내역을 바탕으로 최적의 자산 비중 분석, 투자 성향 진단 및 위험 요인 분석을 도와드리고 있습니다.\n\n궁금한 점이 있으시다면 아래 입력창이나 추천 질문을 선택해 상담을 시작해보세요!',
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
    '내 포트폴리오 자산 비중 분석해줘',
    '특정 섹터 편중도가 높은데, 위험 요인은?',
    '전체 투자 자산을 바탕으로 한 투자 조언은?',
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

      // 3. 포트폴리오 데이터를 JSON 포맷의 읽기 쉬운 구조로 매핑
      const totalAmount = transactions.reduce((s, t) => s + t.price * t.quantity, 0);
      const portfolioContext = transactions.map((t) => ({
        종목명: t.name,
        섹터: t.sector,
        매수일자: t.date,
        매수단가: t.price,
        보유수량: t.quantity,
        투자금액: t.price * t.quantity,
        비중: totalAmount > 0 ? `${((t.price * t.quantity) / totalAmount * 100).toFixed(1)}%` : '0%'
      }));

      // 4. Gemini AI에 전달할 시스템 인스트럭션/페르소나 설계
      const systemInstruction = `당신은 사용자의 주식 가계부 데이터를 분석해주는 전문 자산 관리사(Advisor)입니다. 
사용자의 포트폴리오 비중과 매매 기록을 바탕으로 객관적이고, 친절하며 전문적인 투자 조언을 제공해야 합니다.
답변할 때 아래의 규칙을 엄격히 준수하세요:
1. 사용자가 등록한 자산 현황을 바탕으로 정확하고 상세하게 분석 결과를 알려주세요.
2. 반도체, 바이오, 빅테크 등 편중되어 있는 자산이 있다면 이에 따른 리스크와 헤징(분산 투자) 전략을 제시해주세요.
3. 구체적인 종목 추천(예: 'X종목을 지금 매수하세요')은 지양하고, 자산 배분 비중 및 재조정(리밸런싱) 관점에서 조언을 풍부하게 기술하세요.
4. 존댓말을 사용하여 매우 정중하고 친절하게 답변해주세요.
5. 답변 가독성을 높이기 위해 마크다운 형식(글머리표, 볼드체 등)을 적극적으로 활용하여 항목별로 정리해주세요.

[현재 사용자의 포트폴리오 정보]
- 총 투자 원금: ${totalAmount.toLocaleString()} (단위 무관, 입력 데이터 기준)
- 보유 종목 수: ${transactions.length}개
- 상세 매매 내역 및 비중 JSON: ${JSON.stringify(portfolioContext, null, 2)}
`;

      // 5. 이전 대화 기록 컨텍스트를 프롬프트에 매핑하여 멀티턴 대화 느낌을 연출합니다.
      // (너무 긴 대화는 자르기 위해 최근 6개의 메시지만 추출)
      const recentMessages = messages.slice(-6).map(m => 
        `${m.sender === 'user' ? '사용자' : 'AI 자산관리사'}: ${m.text}`
      ).join('\n');

      const fullPrompt = `${systemInstruction}\n\n[최근 대화 내역]\n${recentMessages}\n\n사용자 최신 질문: ${textToSend}\n\nAI 자산관리사의 전문적인 답변:`;

      // 6. Gemini 2.5 Flash 모델 API 호출
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
      });

      // 7. API 응답 메시지 추출
      const aiReplyText = response.text || '죄송합니다. 답변을 생성하지 못했습니다.';
      
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
          text: `⚠️ **AI 투자 상담사 연결 도중 오류가 발생했습니다.**\n\n- **원인:** 입력하신 Google AI API Key가 유효하지 않거나 일시적인 네트워크 장애일 수 있습니다.\n- **해결 방법:** 상단의 설정 영역에서 API Key를 정확히 다시 복사하여 등록하셨는지 확인해 주시기 바랍니다.\n\n*(상세 에러 내용: ${error.message || 'Unknown Error'})*`,
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
            <h2 className="text-sm font-bold text-slate-100 tracking-wide">Gemini 2.5 Flash 투자 상담소</h2>
            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
              포트폴리오 맞춤 분석 연동 활성화
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
          <h3 className="font-bold text-slate-200">API Key 등록 필요</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
            AI 상담사와 포트폴리오 연동 상담을 진행하시려면 화면 최상단의 <strong>Google AI API 설정</strong> 영역에 API Key를 먼저 입력 및 등록해주세요.
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
                  <div className="max-w-[75%] space-y-1">
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
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
                        // 글머리 기호(-) 처리
                        if (parsedLine.trim().startsWith('-')) {
                          return (
                            <span key={idx} className="block pl-3 text-slate-300 mt-1 relative before:content-['•'] before:absolute before:left-0 before:text-brand-400">
                              {parsedLine.replace(/^\s*-\s*/, '')}
                            </span>
                          );
                        }
                        return <span key={idx} className="block min-h-[0.5rem]">{parsedLine}</span>;
                      })}
                    </div>
                    {/* 전송 시간 표시 */}
                    <div className={`text-[10px] text-slate-500 font-mono ${isAi ? 'text-left' : 'text-right'}`}>
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
                <div className="max-w-[75%] p-3.5 rounded-2xl rounded-tl-none bg-slate-900/90 border border-slate-800/80 text-slate-400 text-xs flex items-center gap-2">
                  <span>AI 자산관리사가 포트폴리오를 분석하고 있습니다</span>
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
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">💡 추천 질문</span>
              <div className="flex flex-col gap-1.5">
                {QUICK_PROMPTS.map((promptText, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendMessage(promptText)}
                    className="text-left text-[11px] text-slate-300 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700/80 py-1.5 px-3 rounded-lg transition-all truncate hover:text-brand-300"
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
              placeholder="포트폴리오 분석이나 투자 상담을 요청하세요..."
              className="flex-1 input-control rounded-xl py-2 px-3 text-xs focus:outline-none"
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
