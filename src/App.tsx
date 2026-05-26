import React, { useState, useEffect } from 'react';
// Lucide React에서 금융 서비스 대시보드에 필요한 장식용 아이콘들을 불러옵니다.
import { Wallet, LineChart, ShieldCheck } from 'lucide-react';
// 하위 컴포넌트들 및 타입 정의 가져오기
import { ApiKeyInput } from './components/ApiKeyInput';
import { TransactionForm } from './components/TransactionForm';
import { PortfolioTable } from './components/PortfolioTable';
import { AIAssistantChat } from './components/AIAssistantChat';
import { Transaction } from './types';

export const App: React.FC = () => {
  // 1. Google AI API Key 상태 정의 (로컬스토리지 로딩)
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });

  // 2. 주식 매매 내역 상태 정의 (로컬스토리지 로딩)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('stock_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('기존 매매 내역 로딩 실패:', e);
        return [];
      }
    }
    return [];
  });

  // 3. API Key 상태가 바뀔 때마다 로컬스토리지에 반영
  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  // 4. 매매 내역 상태가 바뀔 때마다 로컬스토리지에 반영
  useEffect(() => {
    localStorage.setItem('stock_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // 5. 새로운 매매 내역을 추가하는 핸들러 함수
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transactionWithId: Transaction = {
      ...newTx,
      // UUID 라이브러리 없이 고유 ID를 부여하기 위해 브라우저의 crypto API 또는 난수를 생성합니다.
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
    };
    setTransactions((prev) => [transactionWithId, ...prev]);
  };

  // 6. 매매 내역을 고유 ID를 기준으로 삭제하는 핸들러 함수
  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  // 7. API Key를 등록 및 변경하는 핸들러 함수
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
  };

  // 8. API Key를 안전하게 삭제하는 핸들러 함수
  const handleDeleteApiKey = () => {
    setApiKey('');
    localStorage.removeItem('gemini_api_key');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      
      {/* 프리미엄 탑 네비게이션바 (Header) */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 세련된 로고 박스 */}
            <div className="p-2.5 bg-gradient-to-tr from-brand-600 to-sky-400 text-white rounded-xl shadow-lg shadow-brand-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent font-sans uppercase">
                Stock Planner AI
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
                스마트 주식 가계부 & 포트폴리오 자문관
              </p>
            </div>
          </div>
          
          {/* 보안 안심 칩 */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 py-1.5 px-3 rounded-full font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>온디바이스 로컬 보안 스토리지 가동 중</span>
          </div>
        </div>
      </header>

      {/* 대시보드 본문 영역 (최대 가로폭 제한 및 패딩) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* 상단: API Key 설정 폼 */}
        <ApiKeyInput
          apiKey={apiKey}
          onSave={handleSaveApiKey}
          onDelete={handleDeleteApiKey}
        />

        {/* 하단 그리드: 2열 반응형 레이아웃 구성 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 좌측 열: 입력 및 대시보드 테이블 (12칸 중 7칸 배정 - 약 58%) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 매매 기록 추가 폼 컴포넌트 */}
            <TransactionForm onAddTransaction={handleAddTransaction} />
            
            {/* 포트폴리오 자산 테이블 및 섹터 현황 컴포넌트 */}
            <PortfolioTable
              transactions={transactions}
              onDeleteTransaction={handleDeleteTransaction}
            />
            
          </div>

          {/* 우측 열: Gemini AI 투자 상담 챗봇 (12칸 중 5칸 배정 - 약 42%) */}
          <div className="lg:col-span-5 h-full">
            <div className="sticky top-22">
              <AIAssistantChat
                apiKey={apiKey}
                transactions={transactions}
              />
            </div>
          </div>

        </div>

      </main>

      {/* 푸터 영역 */}
      <footer className="border-t border-slate-900 py-6 mt-12 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs font-semibold">
            <LineChart className="w-3.5 h-3.5 text-slate-500" />
            <span>STOCK PLANNER AI 어플리케이션 © 2026. 모든 데이터는 브라우저 내부 로컬스토리지에만 저장됩니다.</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
