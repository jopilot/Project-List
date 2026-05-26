# 📊 Stock Planner AI (주식 가계부 & AI 포트폴리오 상담소)

> **React(Vite) + TypeScript + Tailwind CSS** 기반의 싱글 페이지 자산 관리 웹 애플리케이션입니다.  
> 사용자의 주식 매매 내역을 안전하게 기록하고, 포트폴리오 자산 비중과 섹터별 분포도를 직관적인 표와 차트로 실시간 시각화하며, 저장된 자산 데이터를 기반으로 최신 **Gemini 2.5 Flash** AI 모델과 1:1 맞춤형 투자 리밸런싱 상담을 나눌 수 있습니다.

---

## ✨ 주요 핵심 기능

1. **🔒 온디바이스 로컬 보안 스토리지**
   - 별도의 백엔드 데이터베이스 서버 없이 브라우저 단독으로 구동됩니다.
   - 사용자의 Google AI API Key와 주식 매매 데이터는 브라우저의 `localStorage`에만 영구 보관되므로 외부로 유출될 염려가 없는 안전한 클라이언트 사이드 아키텍처입니다.

2. **📝 유효성 검사 기반의 매매 기록 입력 시스템**
   - 종목명 입력, 콤보박스를 통한 간편한 주요 섹터 선택, Date Picker 및 매수 단가와 수량 입력을 지원합니다.
   - 매수 단가와 수량은 반드시 `0`보다 큰 수치만 입력되도록 엄격한 유효성 검사가 적용되어 데이터 오류를 사전에 차단합니다.

3. **📈 실시간 자산 시각화 대시보드**
   - **자산 비중(%) 게이지:** 각 종목이 내 전체 투자 금액에서 차지하는 비중을 세련된 블루 그라데이션 게이지 바로 보여줍니다.
   - **섹터별 투자 분포 요약:** 테이블 하단에 개별 카드로 섹터별 투자 총금액과 백분율 비중 현황을 깔끔하게 요약해 보여줍니다.

4. **💬 Gemini 2.5 Flash 실시간 1:1 투자 상담소**
   - 구글 공식 `@google/genai` JS SDK를 연동하여 `gemini-2.5-flash` 모델을 직접 호출합니다.
   - 사용자가 메시지를 보낼 때, 현재 포트폴리오 상태가 완벽히 실시간 연동되어 System Instruction 및 Context에 주입됩니다.
   - AI가 사용자의 실제 자산 편중도 및 보유 비중을 완전하게 인지한 상태에서 객관적이고 구체적인 전문 리밸런싱 조언을 건넵니다.
   - 원클릭으로 핵심 질문을 던질 수 있는 **추천 질문(Quick Prompts) 버튼**을 제공해 사용성을 최대로 끌어올렸습니다.

---

## 🛠️ 사용 기술 스택

- **Framework/Library:** React (Vite 기반), TypeScript
- **Styling:** Tailwind CSS, Lucide React (아이콘)
- **AI Integration:** `@google/genai` (Google AI JavaScript SDK)
- **Model:** `gemini-2.5-flash`
- **Data Storage:** Browser LocalStorage

---

## 🚀 로컬 구동 및 설치 방법

프로젝트를 로컬 환경에서 클론한 뒤 구동하려면 다음 절차를 따르세요:

### 1. 패키지 의존성 설치
```bash
npm install
```

### 2. 로컬 개발 서버 구동 (Vite Dev Server)
```bash
npm run dev
```
개발 서버가 구동되면 브라우저에서 `http://localhost:5173` 으로 접속합니다.

### 3. 프로덕션 빌드 및 검증
```bash
npm run build
```
컴파일 오류 없이 완벽한 정적 빌드 결과물이 `dist/` 폴더에 생성됩니다.

---

## 📐 코드 구현 특징
- **컴포넌트의 명확한 분리:** `App.tsx`, `ApiKeyInput.tsx`, `TransactionForm.tsx`, `PortfolioTable.tsx`, `AIAssistantChat.tsx` 등으로 모듈화되어 높은 유지보수성을 지닙니다.
- **한국어 주석 적용:** 모든 코드 내에 상세한 로직 설명과 한국어 주석이 꼼꼼하게 작성되어 있어 코드 분석이 매우 쉽습니다.
