/**
 * 주식 가계부 애플리케이션에서 사용하는 공통 데이터 타입 정의 파일입니다.
 * 사용자의 규칙에 따라 모든 항목에 상세한 한글 주석을 달았습니다.
 */

// 주식 매매 내역 인터페이스 정의
export interface Transaction {
  id: string;         // 고유 식별자 (UUID 또는 타임스탬프 기반 문자열)
  name: string;       // 주식 종목명 (예: 삼성전자, Apple 등)
  sector: string;     // 주식 섹터/분야 (반도체, 바이오, 빅테크 등)
  date: string;       // 매수 날짜 (YYYY-MM-DD 형식)
  price: number;      // 매수 단가 (0보다 큰 숫자)
  quantity: number;   // 매수 수량 (0보다 큰 소수점 지원 숫자)
}

// AI 채팅 메시지 인터페이스 정의
export interface Message {
  id: string;         // 메시지 고유 식별자
  sender: 'user' | 'ai'; // 메시지 발신자 ('user': 사용자, 'ai': 제미나이 AI)
  text: string;       // 메시지 내용 (텍스트 또는 마크다운 형식)
  timestamp: string;  // 메시지 전송 시간 표시용 문자열 (HH:MM)
}

// 애플리케이션에서 지원하는 기본 주요 섹터 목록 상수 정의
export const SECTORS = [
  '반도체',
  '바이오',
  '빅테크',
  '배당주',
  '이차전지',
  '금융',
  '인프라/에너지',
  '소비재',
  '기타'
] as const;

export type SectorType = typeof SECTORS[number];
