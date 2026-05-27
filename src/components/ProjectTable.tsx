import React, { useState, useMemo } from 'react';
// Lucide React에서 모던한 편집, 삭제, 플러스, 검색, 깔때기(필터) 아이콘 등을 가져옵니다.
import { Edit3, Trash2, Plus, Search, Filter, X, Save, AlertCircle } from 'lucide-react';
// 공통 데이터 타입 불러오기
import { Project } from '../types';

// 컴포넌트 Props 타입 정의
interface ProjectTableProps {
  projects: Project[];                          // 현재 로드되어 있는 프로젝트 전체 리스트
  onAddProject: (newProj: Project) => void;     // 신규 프로젝트 수동 추가 콜백
  onUpdateProject: (updatedProj: Project) => void; // 기존 프로젝트 수정 완료 콜백
  onDeleteProject: (projectId: string) => void;  // 기존 프로젝트 삭제 콜백
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}) => {
  // --- 검색 및 필터링을 위한 상태 ---
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  // --- CRUD 모달 제어를 위한 상태 ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // 수정 타겟 프로젝트 ID 보관용
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // 모달 폼 전용 로컬 상태 필드
  const [formIndustry, setFormIndustry] = useState<string>('');
  const [formRegion, setFormRegion] = useState<string>('');
  const [formCountry, setFormCountry] = useState<string>('');
  const [formProjectName, setFormProjectName] = useState<string>('');
  const [formClient, setFormClient] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formEpcContractor, setFormEpcContractor] = useState<string>('');
  const [formAwardedDate, setFormAwardedDate] = useState<string>('');
  const [formCapacity, setFormCapacity] = useState<string>('');

  // 폼 유효성 오류 메시지 상태
  const [formError, setFormError] = useState<string | null>(null);

  // --- 전체 데이터 내에서 고유한 Industry 및 Region 목록 동적 추출 (필터 콤보박스용) ---
  const industries = useMemo(() => {
    const list = new Set(projects.map((p) => p.industry).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [projects]);

  const regions = useMemo(() => {
    const list = new Set(projects.map((p) => p.region).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [projects]);

  // --- 실시간 검색 및 필터링 필터링 결과 계산 ---
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      // 1. 대소문자 구분 없는 검색어 매칭 (프로젝트명, 발주처, 국가, EPC 계약자 대상)
      const matchesSearch = 
        proj.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proj.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proj.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proj.epcContractor.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Industry 필터 매칭
      const matchesIndustry = selectedIndustry === 'All' || proj.industry === selectedIndustry;

      // 3. Region 필터 매칭
      const matchesRegion = selectedRegion === 'All' || proj.region === selectedRegion;

      return matchesSearch && matchesIndustry && matchesRegion;
    });
  }, [projects, searchTerm, selectedIndustry, selectedRegion]);

  // --- 모달 열기 함수 (신규 생성 모드) ---
  const openCreateModal = () => {
    setModalMode('create');
    setEditingProjectId(null);
    setFormError(null);
    
    // 폼 상태 초기화
    setFormIndustry('');
    setFormRegion('');
    setFormCountry('');
    setFormProjectName('');
    setFormClient('');
    setFormAmount('');
    setFormEpcContractor('');
    setFormAwardedDate('');
    setFormCapacity('');

    setIsModalOpen(true);
  };

  // --- 모달 열기 함수 (수정 모드) ---
  const openEditModal = (proj: Project) => {
    setModalMode('edit');
    setEditingProjectId(proj.id);
    setFormError(null);

    // 선택된 프로젝트 정보로 폼 바인딩
    setFormIndustry(proj.industry);
    setFormRegion(proj.region);
    setFormCountry(proj.country);
    setFormProjectName(proj.projectName);
    setFormClient(proj.client);
    setFormAmount(proj.amount);
    setFormEpcContractor(proj.epcContractor);
    setFormAwardedDate(proj.awardedDate);
    setFormCapacity(proj.capacity);

    setIsModalOpen(true);
  };

  // --- 모달 폼 저장 이벤트 핸들러 (수동 추가 및 수정 동시 처리) ---
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // 필수값 유효성 검증
    if (!formProjectName.trim()) {
      setFormError('프로젝트 이름(Project Name)은 필수 입력 항목입니다.');
      return;
    }
    if (!formClient.trim()) {
      setFormError('발주처(Client)는 필수 입력 항목입니다.');
      return;
    }
    if (!formIndustry.trim()) {
      setFormError('산업 분야(Industry)는 필수 입력 항목입니다.');
      return;
    }

    if (modalMode === 'create') {
      // 1. 신규 추가 데이터 빌드
      const newProj: Project = {
        id: `proj-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`,
        industry: formIndustry.trim(),
        region: formRegion.trim() || '미정',
        country: formCountry.trim() || '미정',
        projectName: formProjectName.trim(),
        client: formClient.trim(),
        amount: formAmount.trim() || '0',
        epcContractor: formEpcContractor.trim() || '미정',
        awardedDate: formAwardedDate.trim() || '미정',
        capacity: formCapacity.trim() || '미정',
      };
      onAddProject(newProj);
    } else {
      // 2. 기존 프로젝트 수정 데이터 빌드
      if (!editingProjectId) return;
      const updatedProj: Project = {
        id: editingProjectId,
        industry: formIndustry.trim(),
        region: formRegion.trim() || '미정',
        country: formCountry.trim() || '미정',
        projectName: formProjectName.trim(),
        client: formClient.trim(),
        amount: formAmount.trim() || '0',
        epcContractor: formEpcContractor.trim() || '미정',
        awardedDate: formAwardedDate.trim() || '미정',
        capacity: formCapacity.trim() || '미정',
      };
      onUpdateProject(updatedProj);
    }

    // 모달 닫기
    setIsModalOpen(false);
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-800 shadow-xl p-6 flex flex-col gap-6 w-full">
      
      {/* 1. 테이블 제어 및 검색 헤더 영역 */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            프로젝트 데이터베이스 리스트
            <span className="text-[11px] bg-brand-500/10 text-brand-400 font-mono px-2.5 py-0.5 rounded-full border border-brand-500/20 font-bold">
              총 {filteredProjects.length}개
            </span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">
            파싱된 데이터 조회 및 수동 수정/삭제를 지원하며, 챗봇은 이 테이블 데이터 전체를 인지하고 실시간 상담을 제공합니다.
          </p>
        </div>

        {/* 신규 등록 버튼 */}
        <button
          onClick={openCreateModal}
          className="btn-premium text-white flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide shrink-0 self-end md:self-auto"
        >
          <Plus className="w-4 h-4" />
          신규 프로젝트 수동 등록
        </button>
      </div>

      {/* 2. 실시간 다차원 필터링 및 검색 컨트롤바 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800/80">
        
        {/* 통합 검색바 */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="프로젝트명, 발주처, 국가, 시공사 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full input-control rounded-xl pl-9.5 pr-4 py-2 text-xs"
          />
        </div>

        {/* Industry 필터 */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="w-full input-control rounded-xl pl-9.5 pr-4 py-2 text-xs appearance-none cursor-pointer text-slate-200"
          >
            {industries.map((ind) => (
              <option key={ind} value={ind} className="bg-slate-950 text-slate-200 text-xs">
                산업: {ind === 'All' ? '전체 보기' : ind}
              </option>
            ))}
          </select>
        </div>

        {/* Region 필터 */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full input-control rounded-xl pl-9.5 pr-4 py-2 text-xs appearance-none cursor-pointer text-slate-200"
          >
            {regions.map((reg) => (
              <option key={reg} value={reg} className="bg-slate-950 text-slate-200 text-xs">
                지역: {reg === 'All' ? '전체 보기' : reg}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* 3. 데이터 테이블 본체 영역 */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/20">
        <table className="w-full border-collapse text-left text-xs text-slate-300">
          
          {/* 테이블 헤더 컬럼 이름 */}
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <th className="px-4 py-3">Industry</th>
              <th className="px-4 py-3">Region / Country</th>
              <th className="px-4 py-3 min-w-[150px]">Project Name</th>
              <th className="px-4 py-3">Client (Owner)</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">EPC Contractor</th>
              <th className="px-4 py-3">Awarded Date</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3 text-center min-w-[90px]">Actions</th>
            </tr>
          </thead>

          {/* 테이블 바디 내용 */}
          <tbody className="divide-y divide-slate-800/60">
            {filteredProjects.length === 0 ? (
              // 일치하는 항목이 없을 때
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-500 font-medium">
                  {projects.length === 0 
                    ? '등록된 프로젝트 데이터가 없습니다. PDF를 드롭하거나 수동으로 추가해보세요.'
                    : '검색 및 필터 조건에 부합하는 프로젝트가 존재하지 않습니다.'}
                </td>
              </tr>
            ) : (
              // 필터링된 프로젝트 순회 렌더링
              filteredProjects.map((proj) => (
                <tr key={proj.id} className="hover:bg-slate-900/30 transition-colors group">
                  <td className="px-4 py-3.5">
                    <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                      {proj.industry}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium">
                    <div className="text-slate-200">{proj.region}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{proj.country}</div>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-100 group-hover:text-brand-300 transition-colors">
                    {proj.projectName}
                  </td>
                  <td className="px-4 py-3.5 text-slate-300 font-medium">{proj.client}</td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400">
                    {proj.amount}
                  </td>
                  <td className="px-4 py-3.5 text-slate-300 font-medium">{proj.epcContractor}</td>
                  <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">{proj.awardedDate}</td>
                  <td className="px-4 py-3.5 text-slate-400 text-[11px]">{proj.capacity}</td>
                  
                  {/* 수정 및 삭제 동작 버튼 */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditModal(proj)}
                        title="프로젝트 수정"
                        className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors border border-transparent hover:border-brand-500/20"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`'${proj.projectName}' 프로젝트를 정말 삭제하시겠습니까?`)) {
                            onDeleteProject(proj.id);
                          }
                        }}
                        title="프로젝트 삭제"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. CRUD 통합 폼 다이얼로그 모달 구현 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          
          {/* 모달 박스 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-scaleIn">
            
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-brand-400" />
                {modalMode === 'create' ? '새 프로젝트 수동 등록' : '프로젝트 정보 수정'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 모달 바디 폼 */}
            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
              
              {/* 유효성 검사 에러 메세지 */}
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-rose-300 leading-normal font-medium">{formError}</p>
                </div>
              )}

              {/* 폼 입력 필드들의 그리드 배치 */}
              <div className="grid grid-cols-2 gap-3.5">
                
                {/* Project Name (프로젝트명) - Full width */}
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={formProjectName}
                    onChange={(e) => setFormProjectName(e.target.value)}
                    placeholder="예: Yanbu 4 IWP"
                    className="input-control rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>

                {/* Client (발주처) & EPC Contractor (시공사) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Client (Owner) *</label>
                  <input
                    type="text"
                    required
                    value={formClient}
                    onChange={(e) => setFormClient(e.target.value)}
                    placeholder="예: SWCC"
                    className="input-control rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">EPC Contractor</label>
                  <input
                    type="text"
                    value={formEpcContractor}
                    onChange={(e) => setFormEpcContractor(e.target.value)}
                    placeholder="예: Doosan Enerbility"
                    className="input-control rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>

                {/* Industry (산업군) & Amount (금액) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Industry *</label>
                  <input
                    type="text"
                    required
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value)}
                    placeholder="예: 담수&발전, Oil&Gas, 석유화학 등"
                    className="input-control rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Amount (금액 단위 명기)</label>
                  <input
                    type="text"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="예: €150M 또는 250,000 (1,000$)"
                    className="input-control rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>

                {/* Region (지역) & Country (국가) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Region (지역)</label>
                  <input
                    type="text"
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value)}
                    placeholder="예: 중동, 아시아 등"
                    className="input-control rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Country (국가)</label>
                  <input
                    type="text"
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    placeholder="예: 사우디, 대만 등"
                    className="input-control rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>

                {/* Awarded Date (계약일자) & Capacity (생산 규모) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Awarded Date</label>
                  <input
                    type="text"
                    value={formAwardedDate}
                    onChange={(e) => setFormAwardedDate(e.target.value)}
                    placeholder="예: 2025-08-12 또는 25년 3Q"
                    className="input-control rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Capacity (생산 용량)</label>
                  <input
                    type="text"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    placeholder="예: 450,000 m3/day"
                    className="input-control rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>

              </div>

              {/* 모달 하단 액션 버튼 영역 */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all border border-transparent"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="btn-premium text-white flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold"
                >
                  <Save className="w-3.5 h-3.5" />
                  저장 및 적용
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
