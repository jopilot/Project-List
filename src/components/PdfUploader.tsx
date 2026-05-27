import React, { useState, useCallback } from 'react';
// Lucide React에서 모던한 업로드, 체크, 파일 아이콘 등을 불러옵니다.
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
// @google/genai SDK 임포트
import { GoogleGenAI } from '@google/genai';
// 공통 데이터 타입 불러오기
import { Project } from '../types';

// 컴포넌트 Props 타입 정의
interface PdfUploaderProps {
  apiKey: string;                                          // Gemini API 호출에 필요한 API Key
  onUploadSuccess: (extractedProjects: Project[]) => void; // 추출 성공 시 부모에게 데이터를 전달하는 콜백 함수
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({ apiKey, onUploadSuccess }) => {
  // 드래그 앤 드롭 영역 위에 마우스가 올라와 있는지 관리하는 상태
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  // 현재 업로드 중인 파일명 상태
  const [fileName, setFileName] = useState<string | null>(null);
  // 데이터 분석/추출 진행 중 상태
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  // 에러 메시지 상태
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // 분석 완료 후 성공 메시지 임시 표시용 상태
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 드래그 진입 및 마우스 오버 시 이벤트 핸들러
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  // PDF 파일을 읽어와 Gemini API로 처리하는 핵심 비즈니스 로직
  const processPdfFile = async (file: File) => {
    if (!file) return;
    
    // 파일 형식 검사: 오직 PDF 파일만 허용
    if (file.type !== 'application/pdf') {
      setErrorMsg('PDF 형식의 파일만 업로드할 수 있습니다.');
      setFileName(null);
      return;
    }

    // 상태 초기화
    setErrorMsg(null);
    setSuccessMsg(null);
    setFileName(file.name);
    setIsAnalyzing(true);

    try {
      // 1. 브라우저 FileReader를 통해 PDF 파일을 Base64 데이터 문자열로 변환합니다.
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // 'data:application/pdf;base64,' 접두사를 분리하고 순수 base64 데이터만 추출합니다.
          const base64Str = result.split(',')[1];
          resolve(base64Str);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });

      // 2. GoogleGenAI 인스턴스를 사용자의 API Key로 생성합니다.
      const ai = new GoogleGenAI({ apiKey: apiKey });

      // 3. Structured Outputs 지시 및 JSON 스키마를 구성하여 API를 호출합니다.
      // - 1,000$ 단위가 아닐 경우 반드시 화폐(Currency) 기호/명칭을 명기하도록 프롬프트를 보강했습니다.
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data
            }
          },
          `당신은 프로젝트 관리 및 데이터 분석 전문가입니다. 
업로드된 PDF 내의 모든 프로젝트 정보를 면밀히 분석하고 누락 없이 추출하십시오. 

★ 중요 지시사항 (Amount 단위 기입 규칙):
- 기본적으로 Amount의 단위는 1,000$ 또는 원본 그대로 표시합니다.
- 만약 원본 데이터의 금액 단위가 1,000$가 아니거나 유로화(€), 한국 원화(₩, KRW) 등 다른 화폐 단위일 경우, 반드시 해당 화폐 단위(Currency 기호 또는 영문 코드)를 금액 텍스트에 기입하여 문자열로 리턴하십시오.
- 예: "€150,000", "5,200,000,000 KRW", "₩350,000,000", "€1.2B" 등.`
        ],
        config: {
          // JSON 응답으로 출력을 고정합니다.
          responseMimeType: "application/json",
          // typescript 스키마에 완전히 부합하도록 Response JSON Schema를 강제합니다.
          responseSchema: {
            type: "ARRAY",
            description: "PDF 문서에서 정밀하게 파싱하여 추출한 프로젝트 목록 정보 배열",
            items: {
              type: "OBJECT",
              properties: {
                industry: { type: "STRING", description: "Industry (예: Oil&Gas, 담수&발전, 인프라 등)" },
                region: { type: "STRING", description: "지역 (예: 중동, 아시아, 아프리카 등)" },
                country: { type: "STRING", description: "Country (예: 사우디, 대만, 이집트 등)" },
                projectName: { type: "STRING", description: "Project Name (프로젝트명)" },
                client: { type: "STRING", description: "Client (Owner, 발주처)" },
                amount: { type: "STRING", description: "Amount (단위: 1,000$ 또는 다른 화폐 단위일 시 €, ₩ 등 화폐 기호 필수 기입)" },
                epcContractor: { type: "STRING", description: "EPC Contractor (시공사/계약사)" },
                awardedDate: { type: "STRING", description: "Awarded Date (수주/계약 일자)" },
                capacity: { type: "STRING", description: "Capacity (생산 용량/규모)" }
              },
              // 모든 필드가 필수 항목이 되도록 보장하여 데이터 유실을 방지합니다.
              required: [
                "industry", "region", "country", "projectName", "client", 
                "amount", "epcContractor", "awardedDate", "capacity"
              ]
            }
          }
        }
      });

      // 4. 응답으로 전송받은 JSON 텍스트 파싱
      const rawText = response.text;
      if (!rawText) {
        throw new Error('Gemini API가 비어있는 응답을 반환했습니다.');
      }

      const parsedProjects: Omit<Project, 'id'>[] = JSON.parse(rawText);
      
      // 5. 각 프로젝트에 클라이언트 단에서 관리할 고유 ID(랜덤 해시)를 부여합니다.
      const finalProjects: Project[] = parsedProjects.map((p) => ({
        ...p,
        id: `proj-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`
      }));

      // 6. 성공 콜백 호출 및 상태 업데이트
      onUploadSuccess(finalProjects);
      setSuccessMsg(`성공적으로 ${finalProjects.length}개의 프로젝트를 파싱 및 추가했습니다!`);
      
      // 성공 피드백 후 4초 뒤 초기 상태로 리셋
      setTimeout(() => {
        setFileName(null);
        setSuccessMsg(null);
      }, 4000);

    } catch (err: any) {
      console.error('PDF parsing error:', err);
      setErrorMsg(`PDF 분석 중 오류가 발생했습니다: ${err.message || 'Unknown Error'}`);
    } finally {
      setIsAnalyzing(false);
      setIsDragActive(false);
    }
  };

  // 드롭존에 파일 드롭 시 이벤트 핸들러
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (!apiKey) {
      setErrorMsg('먼저 화면 우측 상단에서 Google Gemini API Key를 설정해주세요.');
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPdfFile(e.dataTransfer.files[0]);
    }
  }, [apiKey]);

  // 파일 브라우저 클릭으로 선택 시 이벤트 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!apiKey) {
      setErrorMsg('먼저 화면 우측 상단에서 Google Gemini API Key를 설정해주세요.');
      return;
    }

    if (e.target.files && e.target.files[0]) {
      processPdfFile(e.target.files[0]);
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-800 shadow-lg p-6 flex flex-col gap-4">
      {/* 컴포넌트 헤더 */}
      <div>
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-brand-400" />
          프로젝트 PDF 업로드 및 AI 자동 구조화
        </h3>
        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
          매주 업데이트되는 프로젝트 현황 PDF 파일을 드래그하여 등록하면, **Gemini 3.5 Flash** 멀티모달 모델이 표와 텍스트를 인식하여 정확한 프로젝트 관리 스키마 데이터(JSON)로 완벽히 변환 및 추가합니다.
        </p>
      </div>

      {/* API Key가 설정되지 않았을 때 활성화되는 락 배너 */}
      {!apiKey && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-300 leading-normal font-medium">
            <strong>Gemini API Key 미설정:</strong> 상단 네비게이션 헤더에서 API Key를 먼저 저장하셔야 PDF 업로드 분석 및 자동 파싱 기능을 활성화할 수 있습니다.
          </p>
        </div>
      )}

      {/* 드롭존 본체 */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${
          !apiKey 
            ? 'border-slate-800 bg-slate-950/20 cursor-not-allowed opacity-60' 
            : isDragActive
            ? 'border-brand-400 bg-brand-500/5 shadow-[0_0_15px_rgba(56,171,249,0.1)]'
            : 'border-slate-700 hover:border-slate-600 bg-slate-900/30'
        }`}
      >
        <input
          type="file"
          id="pdf-file-input"
          accept=".pdf"
          disabled={!apiKey || isAnalyzing}
          onChange={handleFileChange}
          className="hidden"
        />

        {isAnalyzing ? (
          // 분석 중 피드백 UI
          <div className="flex flex-col items-center gap-3 text-center py-4">
            <Loader className="w-10 h-10 text-brand-400 animate-spin" />
            <div>
              <p className="text-xs font-bold text-slate-200">Gemini AI가 PDF를 정밀 분석하고 있습니다</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-normal">
                PDF 내의 테이블 및 프로젝트 리스트를 추출하여 표준 스키마 데이터로 변환 중입니다. 잠시만 기다려주세요...
              </p>
            </div>
            {fileName && (
              <span className="text-[10px] bg-slate-900 text-slate-400 px-2.5 py-1 rounded-md border border-slate-800 font-mono max-w-[200px] truncate">
                {fileName}
              </span>
            )}
          </div>
        ) : successMsg ? (
          // 추출 성공 피드백 UI
          <div className="flex flex-col items-center gap-2.5 text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
            <p className="text-xs font-bold text-emerald-400">{successMsg}</p>
            <p className="text-[10px] text-slate-400">데이터가 실시간 대시보드 테이블에 즉각 병합되었습니다.</p>
          </div>
        ) : (
          // 대기 및 업로드 안내 UI
          <label
            htmlFor={apiKey ? "pdf-file-input" : undefined}
            className={`flex flex-col items-center gap-3 text-center cursor-pointer py-4 w-full ${
              !apiKey ? 'cursor-not-allowed' : ''
            }`}
          >
            <div className={`p-3 rounded-xl ${isDragActive ? 'bg-brand-500/10 text-brand-400' : 'bg-slate-800/80 text-slate-400'} transition-colors`}>
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">
                {isDragActive ? '이곳에 PDF 파일을 드롭하세요' : '클릭하여 PDF를 탐색하거나 파일 드롭'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                지원 형식: PDF (최대 10MB)
              </p>
            </div>
          </label>
        )}
      </div>

      {/* 에러 피드백 노출 영역 */}
      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-[10px] text-rose-300 leading-normal">
            <span className="font-semibold">오류 발생:</span> {errorMsg}
          </div>
        </div>
      )}
    </div>
  );
};
