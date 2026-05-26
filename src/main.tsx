import React from 'react';
import ReactDOM from 'react-dom/client';
// 메인 어플리케이션 컴포넌트 불러오기
import { App } from './App';
// 전역 테일윈드 및 커스텀 스타일시트 적용
import './index.css';

// DOM에서 'root' 요소를 찾아 React 가상 DOM 루트를 생성하고 렌더링을 시작합니다.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 엄격 모드(StrictMode)로 감싸 잠재적인 React 생명주기 오류나 사이드 이펙트를 감지합니다. */}
    <App />
  </React.StrictMode>
);
