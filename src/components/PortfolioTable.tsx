import React from 'react';
// Lucide React에서 금융 대시보드에 어울리는 아이콘들을 불러옵니다.
import { Trash2, PieChart, TrendingUp, Info } from 'lucide-react';
// 데이터 타입 정의 불러오기
import { Transaction } from '../types';

// 컴포넌트 Props 타입 정의
interface PortfolioTableProps {
  transactions: Transaction[];               // 저장된 전체 주식 매매 내역 배열
  onDeleteTransaction: (id: string) => void; // 특정 매매 데이터를 삭제하는 콜백 함수
}

export const PortfolioTable: React.FC<PortfolioTableProps> = ({
  transactions,
  onDeleteTransaction,
}) => {
  // 1. 총 매수 금액(단가 * 수량) 합계 계산
  const totalInvestment = transactions.reduce(
    (sum, tx) => sum + tx.price * tx.quantity,
    0
  );

  // 2. 섹터별 매수 총액 및 비중 계산
  const sectorMap: { [key: string]: number } = {};
  transactions.forEach((tx) => {
    const txAmount = tx.price * tx.quantity;
    sectorMap[tx.sector] = (sectorMap[tx.sector] || 0) + txAmount;
  });

  // 섹터별 정보를 렌더링하기 좋게 정렬된 배열로 변환
  const sectorSummary = Object.entries(sectorMap).map(([sector, amount]) => {
    const percentage = totalInvestment > 0 ? (amount / totalInvestment) * 100 : 0;
    return { sector, amount, percentage };
  }).sort((a, b) => b.amount - a.amount); // 금액이 큰 섹터 순으로 정렬

  // 숫자를 세 자리 콤마와 함께 소수점 둘째 자리까지 포맷팅하는 유틸리티 함수
  const formatNumber = (num: number) => {
    // 소수점이 있으면 최대 소수점 4자리까지 표시하고, 없으면 정수로 표시합니다.
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. 포트폴리오 메인 테이블 테이블 영역 */}
      <div className="glass-card rounded-2xl shadow-xl overflow-hidden border border-slate-800">
        
        {/* 대시보드 헤더 영역 */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-500/10 text-brand-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-100 tracking-wide">내 자산 포트폴리오</h2>
          </div>
          <span className="text-xs bg-slate-900 border border-slate-700/50 text-slate-400 py-1 px-2.5 rounded-full font-medium">
            보유 종목수: <span className="text-brand-400 font-bold">{transactions.length}</span>개
          </span>
        </div>

        {/* 테이블 데이터 렌더링 */}
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            // 데이터가 없을 때 표시할 빈 안내판
            <div className="p-16 text-center">
              <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">등록된 주식 매매 내역이 없습니다.</p>
              <p className="text-xs text-slate-600 mt-1">좌측 폼을 통해 매매 기록을 등록하여 분석을 시작하세요.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                  <th className="py-4 px-5">섹터 / 종목명</th>
                  <th className="py-4 px-4">매수 날짜</th>
                  <th className="py-4 px-4 text-right">매수 단가</th>
                  <th className="py-4 px-4 text-right">수량</th>
                  <th className="py-4 px-4 text-right">총 매수 금액</th>
                  <th className="py-4 px-4 text-center w-36">자산 비중 (%)</th>
                  <th className="py-4 px-5 text-center w-14">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {transactions.map((tx) => {
                  const amount = tx.price * tx.quantity;
                  const ratio = totalInvestment > 0 ? (amount / totalInvestment) * 100 : 0;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-900/30 transition-colors group">
                      {/* 섹터 / 종목명 */}
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-100">{tx.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 inline-block bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {tx.sector}
                        </div>
                      </td>
                      {/* 매수 날짜 */}
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                        {tx.date}
                      </td>
                      {/* 매수 단가 */}
                      <td className="py-3.5 px-4 text-right font-mono font-medium">
                        {formatNumber(tx.price)}
                      </td>
                      {/* 수량 */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                        {formatNumber(tx.quantity)}
                      </td>
                      {/* 총 매수 금액 */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-brand-300">
                        {formatNumber(amount)}
                      </td>
                      {/* 자산 비중 (%) 및 시각화 게이지바 */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-center gap-1.5 w-full">
                          <span className="font-mono text-xs font-semibold text-slate-200">
                            {ratio.toFixed(1)}%
                          </span>
                          {/* 은은한 게이지 바를 통한 시각적 효과 극대화 */}
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sky-400"
                              style={{ width: `${ratio}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      {/* 삭제 액션 */}
                      <td className="py-3.5 px-5 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="매매 기록 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              
              {/* 하단 요약행 */}
              <tfoot>
                <tr className="bg-slate-900/40 font-bold border-t border-slate-800 text-slate-100">
                  <td colSpan={4} className="py-4 px-5 text-left text-xs uppercase tracking-wider text-slate-400">
                    종합 요약 (Total Investment)
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-base text-brand-400">
                    {formatNumber(totalInvestment)}
                  </td>
                  <td className="py-4 px-4 text-center font-mono text-sm text-slate-300">
                    {transactions.length > 0 ? '100.0%' : '0.0%'}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* 2. 섹터별 투자 비중 요약 영역 (글라스모피즘 카드) */}
      {transactions.length > 0 && (
        <div className="glass-card p-5 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
              <PieChart className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 tracking-wide">섹터별 투자 분포</h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {sectorSummary.map(({ sector, amount, percentage }) => (
              <div
                key={sector}
                className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700/50 transition-all group"
              >
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block tracking-wider">
                    {sector}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300 mt-1 block">
                    {formatNumber(amount)}
                  </span>
                </div>
                
                {/* 섹터별 비중 퍼센트 칩 */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-900">
                  <span className="text-xs font-mono font-bold text-sky-400">
                    {percentage.toFixed(1)}%
                  </span>
                  <div className="w-16 h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full group-hover:bg-brand-400 transition-colors"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
