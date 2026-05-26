import React, { useState } from 'react';
// Lucide React에서 적합한 아이콘들을 로드합니다.
import { Plus, Calendar, DollarSign, Activity, Tag, HelpCircle } from 'lucide-react';
// 공통 데이터 타입 및 섹터 정의 불러오기
import { Transaction, SECTORS } from '../types';

// 컴포넌트 Props 타입 정의
interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void; // 새로운 매매 데이터를 추가하는 부모의 콜백 함수
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction }) => {
  // 입력 폼 필드들을 관리하기 위한 로컬 상태 정의
  const [name, setName] = useState<string>('');
  const [sector, setSector] = useState<string>(SECTORS[0]);
  const [date, setDate] = useState<string>(() => {
    // 오늘 날짜를 YYYY-MM-DD 형식의 기본값으로 세팅합니다.
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');

  // 폼 유효성 검사 에러 메세지를 저장하는 로컬 상태
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 폼 제출 핸들러 함수
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사 에러 초기화
    const newErrors: { [key: string]: string } = {};

    // 1. 종목명 검사
    if (!name.trim()) {
      newErrors.name = '종목명을 입력해주세요.';
    }

    // 2. 매수 단가 검사 (0보다 큰 숫자)
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      newErrors.price = '0보다 큰 매수 단가를 입력해주세요.';
    }

    // 3. 매수 수량 검사 (0보다 큰 숫자, 소수점 지원)
    const numericQuantity = parseFloat(quantity);
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      newErrors.quantity = '0보다 큰 매수 수량을 입력해주세요.';
    }

    // 4. 날짜가 입력되었는지 확인
    if (!date) {
      newErrors.date = '매수 날짜를 선택해주세요.';
    }

    // 에러가 있다면 폼 제출을 차단하고 사용자에게 표시합니다.
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 모든 검사를 통과했다면 부모 컴포넌트에 데이터를 전송합니다.
    onAddTransaction({
      name: name.trim(),
      sector,
      date,
      price: numericPrice,
      quantity: numericQuantity,
    });

    // 성공적으로 추가된 후 폼 입력 필드를 초기화합니다. (날짜와 섹터는 기본값 유지)
    setName('');
    setPrice('');
    setQuantity('');
    setErrors({});
  };

  return (
    <div className="glass-card p-6 rounded-2xl shadow-xl border border-slate-800">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-brand-500/10 text-brand-400 rounded-lg">
          <Activity className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-100 tracking-wide">매매 기록 입력</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 종목명 입력 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              종목명
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="예: 삼성전자, 테슬라, AAPL"
              className={`input-control rounded-xl py-2.5 px-3.5 text-sm ${
                errors.name ? 'border-rose-500/50 focus:border-rose-500' : ''
              }`}
            />
            {errors.name && <span className="text-[11px] text-rose-400 font-medium ml-1">{errors.name}</span>}
          </div>

          {/* 섹터/분야 선택 콤보박스 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              섹터 / 분야
            </label>
            <div className="relative">
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full input-control rounded-xl py-2.5 px-3.5 text-sm appearance-none cursor-pointer"
              >
                {SECTORS.map((sec) => (
                  <option key={sec} value={sec} className="bg-slate-900 text-slate-100">
                    {sec}
                  </option>
                ))}
              </select>
              {/* 셀렉트 드롭다운 화살표 장식 */}
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 border-l border-t border-slate-400 w-2 h-2 rotate-45 transform"></div>
            </div>
          </div>

          {/* 매수 날짜 선택 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              매수 날짜
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
              }}
              className={`input-control rounded-xl py-2.5 px-3.5 text-sm ${
                errors.date ? 'border-rose-500/50 focus:border-rose-500' : ''
              }`}
            />
            {errors.date && <span className="text-[11px] text-rose-400 font-medium ml-1">{errors.date}</span>}
          </div>

          {/* 매수 단가 입력 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              매수 단가 (가격)
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (errors.price) setErrors(prev => ({ ...prev, price: '' }));
                }}
                placeholder="숫자로만 입력 (예: 72000, 185.5)"
                className={`w-full input-control rounded-xl py-2.5 px-3.5 text-sm ${
                  errors.price ? 'border-rose-500/50 focus:border-rose-500' : ''
                }`}
              />
            </div>
            {errors.price && <span className="text-[11px] text-rose-400 font-medium ml-1">{errors.price}</span>}
          </div>

          {/* 매수 수량 입력 (소수점 지원) */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              매수 수량 <span className="text-[10px] text-brand-400">(소수점 지원)</span>
            </label>
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                if (errors.quantity) setErrors(prev => ({ ...prev, quantity: '' }));
              }}
              placeholder="매수한 주식의 수량을 입력 (예: 10, 2.5)"
              className={`input-control rounded-xl py-2.5 px-3.5 text-sm ${
                errors.quantity ? 'border-rose-500/50 focus:border-rose-500' : ''
              }`}
            />
            {errors.quantity && <span className="text-[11px] text-rose-400 font-medium ml-1">{errors.quantity}</span>}
          </div>

        </div>

        {/* 매수 기록 추가 버튼 */}
        <button
          type="submit"
          className="w-full btn-premium py-3 px-4 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mt-2"
        >
          <Plus className="w-4 h-4" />
          <span>포트폴리오에 추가</span>
        </button>
      </form>
    </div>
  );
};
