/**
 * 프로젝트 리스트 관리 및 챗봇 대시보드에서 사용하는 공통 데이터 타입 정의 파일입니다.
 * 모든 항목에 상세한 한글 주석을 작성했습니다.
 */

// 프로젝트 정보 인터페이스 정의
export interface Project {
  id: string;             // 프로젝트 고유 식별자 (로컬 클라이언트 사이드 관리를 위한 UUID/타임스탬프)
  industry: string;       // Industry (예: Oil&Gas, 담수&발전 등)
  region: string;         // 지역 (예: 중동, 아시아 등)
  country: string;        // Country (예: 사우디, 대만 등)
  projectName: string;    // Project Name
  client: string;         // Client (Owner)
  amount: string;         // Amount (단위: 1,000$ 또는 1,000$ 단위가 아닐 시 반드시 해당 Currency 단위 기입)
  epcContractor: string;  // EPC Contractor
  awardedDate: string;    // Awarded Date
  capacity: string;       // Capacity
}

// AI 채팅 메시지 인터페이스 정의
export interface Message {
  id: string;             // 메시지 고유 식별자
  sender: 'user' | 'ai';  // 메시지 발신자 ('user': 사용자, 'ai': 제미나이 AI)
  text: string;           // 메시지 내용 (텍스트 또는 마크다운 형식)
  timestamp: string;      // 메시지 전송 시간 표시용 문자열 (HH:MM)
}

