import React, { useState, useEffect, useMemo } from 'react';
// Lucide React에서 글로벌 대시보드에 어울리는 프리미엄 아이콘들을 불러옵니다.
import { Briefcase, BarChart3, ShieldCheck, Globe, Building2, Landmark, RefreshCw } from 'lucide-react';
// 하위 컴포넌트들 및 타입 정의 가져오기
import { ApiKeyInput } from './components/ApiKeyInput';
import { PdfUploader } from './components/PdfUploader';
import { ProjectTable } from './components/ProjectTable';
import { AIAssistantChat } from './components/AIAssistantChat';
import { Project } from './types';

// 초기 진입 시 대시보드를 풍성하게 채워줄 예시 프로젝트 데이터 목록 정의
const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-mock-1',
    industry: '담수&발전',
    region: '중동',
    country: '사우디',
    projectName: 'Yanbu 4 IWP Desalination',
    client: 'SWCC',
    amount: '€450M', // 1,000$ 단위가 아닐 시 화폐기호를 명시적으로 기입한 유효 데이터 예시
    epcContractor: 'Doosan Enerbility',
    awardedDate: '2024-05-12',
    capacity: '450,000 m3/day'
  },
  {
    id: 'proj-mock-2',
    industry: 'Oil&Gas',
    region: '아시아',
    country: '대만',
    projectName: 'Taoyuan LNG Terminal Expansion',
    client: 'CPC Corporation',
    amount: '380,000', // 기본 1,000$ 단위의 예시
    epcContractor: 'CTCI Corporation',
    awardedDate: '2024-11-20',
    capacity: '3.0 MTPA'
  },
  {
    id: 'proj-mock-3',
    industry: '신재생에너지',
    region: '유럽',
    country: '덴마크',
    projectName: 'Thor Offshore Wind Farm',
    client: 'RWE Renewables',
    amount: '€1.2B',
    epcContractor: 'Siemens Gamesa',
    awardedDate: '2025-02-15',
    capacity: '1,000 MW'
  }
];

export const App: React.FC = () => {
  // 1. Google AI API Key 상태 정의 (로컬스토리지 로딩)
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });

  // 2. 프로젝트 목록 데이터 상태 정의 (로컬스토리지 로딩, 없을 시 MOCK 데이터로 초기화하여 프리미엄 UX 유지)
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('global_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('기존 프로젝트 내역 로딩 실패:', e);
        return MOCK_PROJECTS;
      }
    }
    return MOCK_PROJECTS;
  });

  // 3. API Key 상태가 바뀔 때마다 로컬스토리지에 반영
  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  // 4. 프로젝트 내역 상태가 바뀔 때마다 로컬스토리지에 동기화
  useEffect(() => {
    localStorage.setItem('global_projects', JSON.stringify(projects));
  }, [projects]);

  // 5. 신규 프로젝트 수동 등록 핸들러 함수
  const handleAddProject = (newProj: Project) => {
    setProjects((prev) => [newProj, ...prev]);
  };

  // 6. 기존 프로젝트 수정 완료 핸들러 함수
  const handleUpdateProject = (updatedProj: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProj.id ? updatedProj : p))
    );
  };

  // 7. 기존 프로젝트 삭제 핸들러 함수
  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // 8. PDF 파싱이 완료되어 새로운 프로젝트 배열이 대량 업로드되었을 때 실행되는 병합 콜백 함수
  const handleUploadSuccess = (extractedList: Project[]) => {
    // 추출된 목록을 기존 리스트 맨 앞에 머지합니다.
    setProjects((prev) => [...extractedList, ...prev]);
  };

  // 9. API Key를 등록 및 변경하는 핸들러 함수
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
  };

  // 10. API Key를 안전하게 삭제하는 핸들러 함수
  const handleDeleteApiKey = () => {
    setApiKey('');
    localStorage.removeItem('gemini_api_key');
  };

  // --- 실시간 대시보드 요약 통계 계산 ---
  const stats = useMemo(() => {
    const totalCount = projects.length;
    
    // 산업별 분포 개수 및 비중 구하기
    const industryMap: { [key: string]: number } = {};
    // 지역별 분포 개수 및 비중 구하기
    const regionMap: { [key: string]: number } = {};

    projects.forEach((p) => {
      if (p.industry) {
        industryMap[p.industry] = (industryMap[p.industry] || 0) + 1;
      }
      if (p.region) {
        regionMap[p.region] = (regionMap[p.region] || 0) + 1;
      }
    });

    // 정렬하여 가장 비중이 큰 산업/지역 산출
    const topIndustry = Object.entries(industryMap)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '없음';

    const topRegion = Object.entries(regionMap)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '없음';

    return {
      totalCount,
      topIndustry,
      topRegion,
      industryMap,
      regionMap
    };
  }, [projects]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      
      {/* 프리미엄 탑 네비게이션바 (Header) */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 세련된 로고 박스 */}
            <div className="p-2.5 bg-gradient-to-tr from-brand-600 to-sky-400 text-white rounded-xl shadow-lg shadow-brand-500/20">
              <Briefcase className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent font-sans uppercase">
                PROJEX AI
              </h1>
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
                글로벌 프로젝트 대시보드 & 스마트 챗봇
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

      {/* 대시보드 본문 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* 1. 상단: API Key 설정 폼 */}
        <ApiKeyInput
          apiKey={apiKey}
          onSave={handleSaveApiKey}
          onDelete={handleDeleteApiKey}
        />

        {/* 2. 대시보드 요약 통계 카드 섹션 (글래스모피즘 적용) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* 총 등록 프로젝트 카드 */}
          <div className="glass-card p-4.5 rounded-xl border border-slate-800 flex items-center gap-4 hover:shadow-brand-500/5 transition-all">
            <div className="p-3 bg-brand-500/10 text-brand-400 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">총 관리 프로젝트</div>
              <div className="text-lg font-extrabold mt-1 text-slate-100">{stats.totalCount}개</div>
            </div>
          </div>

          {/* 주도적 산업군 카드 */}
          <div className="glass-card p-4.5 rounded-xl border border-slate-800 flex items-center gap-4 hover:shadow-brand-500/5 transition-all">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-lg">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">최다 수주 산업군</div>
              <div className="text-base font-extrabold mt-1 text-sky-300 truncate max-w-[150px]">{stats.topIndustry}</div>
            </div>
          </div>

          {/* 활발한 투자 지역 카드 */}
          <div className="glass-card p-4.5 rounded-xl border border-slate-800 flex items-center gap-4 hover:shadow-brand-500/5 transition-all">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">주요 수주 지역</div>
              <div className="text-base font-extrabold mt-1 text-emerald-300 truncate max-w-[150px]">{stats.topRegion}</div>
            </div>
          </div>

          {/* 리로드/초기화 카드 (샘플 리셋) */}
          <div className="glass-card p-4.5 rounded-xl border border-slate-800 flex items-center justify-between hover:shadow-brand-500/5 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">샘플 복원</div>
                <div className="text-[10px] text-slate-500 mt-1 leading-tight">Mock 데이터로 리셋</div>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('현재 저장된 프로젝트 내역을 삭제하고 기본 샘플 데이터로 복구하시겠습니까?')) {
                  setProjects(MOCK_PROJECTS);
                }
              }}
              className="px-2.5 py-1.5 text-[10px] bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all rounded-lg"
            >
              Reset
            </button>
          </div>

        </div>

        {/* 3. 하단 메인 레이아웃 그리드 (반응형 2열 레이아웃) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 좌측 열: PDF 업로더 & 프로젝트 테이블 (7칸 배정 - 약 58%) */}
          <div className="lg:col-span-7 space-y-6 flex flex-col">
            
            {/* PDF 드롭존 및 AI 데이터 파싱 컴포넌트 */}
            <PdfUploader 
              apiKey={apiKey} 
              onUploadSuccess={handleUploadSuccess} 
            />

            {/* 프로젝트 관리 및 CRUD 테이블 컴포넌트 */}
            <ProjectTable
              projects={projects}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
            />

          </div>

          {/* 우측 열: Gemini 3.5 Flash 실시간 챗봇 상담소 (5칸 배정 - 약 42%) */}
          <div className="lg:col-span-5 h-full">
            <div className="sticky top-22">
              <AIAssistantChat
                apiKey={apiKey}
                projects={projects}
              />
            </div>
          </div>

        </div>

      </main>

      {/* 푸터 영역 */}
      <footer className="border-t border-slate-900 py-6 mt-12 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs font-semibold">
            <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
            <span>PROJEX AI 글로벌 대시보드 © 2026. 모든 데이터는 브라우저 내부 로컬스토리지에 안전하게 기록됩니다.</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

