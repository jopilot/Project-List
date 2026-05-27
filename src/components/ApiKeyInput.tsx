import React, { useState, useEffect } from 'react';
// Lucide React에서 금융 대시보드에 어울리는 아이콘들을 불러옵니다.
import { Key, Eye, EyeOff, Check, Trash2 } from 'lucide-react';

// 컴포넌트 Props 타입 정의
interface ApiKeyInputProps {
  apiKey: string;                            // 상위 컴포넌트에서 전달받은 현재 저장된 API Key
  onSave: (key: string) => void;             // API Key를 저장할 때 실행할 핸들러 함수
  onDelete: () => void;                      // API Key를 삭제할 때 실행할 핸들러 함수
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  apiKey,
  onSave,
  onDelete,
}) => {
  // 사용자의 입력을 관리할 로컬 상태
  const [inputKey, setInputKey] = useState<string>('');
  // API Key의 노출/가림 상태를 제어할 로컬 상태
  const [showKey, setShowKey] = useState<boolean>(false);
  // 저장 성공 시 피드백 애니메이션을 보여주기 위한 상태
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState<boolean>(false);

  // 상위 컴포넌트의 apiKey 값이 변경되면 입력 필드에 동기화합니다.
  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  // 저장 버튼 클릭 시 실행되는 함수
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    
    // 상위 컴포넌트의 저장 함수 호출
    onSave(inputKey.trim());
    
    // 저장 성공 피드백 표시 (1.5초간 노출)
    setIsSavedSuccessfully(true);
    const timer = setTimeout(() => {
      setIsSavedSuccessfully(false);
    }, 1500);
    return () => clearTimeout(timer);
  };

  // 삭제 버튼 클릭 시 실행되는 함수
  const handleDelete = () => {
    if (window.confirm('저장된 API Key를 삭제하시겠습니까? 삭제 시 AI 상담 기능을 사용할 수 없습니다.')) {
      onDelete();
      setInputKey('');
    }
  };

  return (
    <div className="w-full glass-card p-4 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-brand-500/5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* 설명 및 아이콘 영역 */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-500/10 rounded-xl text-brand-400">
            <Key className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 font-sans tracking-wide">Google Gemini API 설정</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Gemini AI 연동을 위해 API Key를 입력하세요. 브라우저 로컬 저장소에만 안전하게 기록됩니다.
            </p>
          </div>
        </div>

        {/* 입력 및 제어 폼 */}
        <form onSubmit={handleSubmit} className="flex flex-1 max-w-lg items-center gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AI API Key (AIzaSy...)"
              className="w-full input-control rounded-xl py-2 px-3 pr-10 text-sm font-mono placeholder:text-slate-600 focus:outline-none"
            />
            {/* API Key 가리기 / 보이기 토글 버튼 */}
            {inputKey && (
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                title={showKey ? '키 숨기기' : '키 보기'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* 저장 버튼 */}
            <button
              type="submit"
              disabled={!inputKey.trim() || inputKey === apiKey}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isSavedSuccessfully
                  ? 'bg-emerald-600 text-white shadow-emerald-950/20'
                  : inputKey.trim() && inputKey !== apiKey
                  ? 'btn-premium text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              {isSavedSuccessfully ? (
                <>
                  <Check className="w-4 h-4 animate-scale-up" />
                  <span>저장됨</span>
                </>
              ) : (
                <span>등록</span>
              )}
            </button>

            {/* 삭제 버튼 (기존 저장된 키가 있을 때만 노출) */}
            {apiKey && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"
                title="API Key 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
