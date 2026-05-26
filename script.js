/* ==========================================================================
   GlowCalc JS - Core Computational Engine & Rich UI Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // === 1. DOM 요소 선택 ===
    const displayExpr = document.getElementById('display-expr');
    const displayRes = document.getElementById('display-res');
    const evalPrev = document.getElementById('eval-prev');
    const angleToggle = document.getElementById('angle-unit-toggle');
    const themeToggle = document.getElementById('theme-toggle');
    const historyToggle = document.getElementById('history-toggle');
    const historyClose = document.getElementById('history-close');
    const historyDrawer = document.getElementById('history-drawer');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');
    const tabBasic = document.getElementById('tab-basic');
    const tabSci = document.getElementById('tab-scientific');
    const sciPanel = document.getElementById('scientific-panel');
    const copyToast = document.getElementById('copy-toast');
    const calcDisplay = document.getElementById('calc-display');

    // === 2. 애플리케이션 상태 변수 ===
    let currentExpression = '';
    let isEvaluated = false;
    let angleUnit = localStorage.getItem('glowcalc-angle-unit') || 'DEG'; // DEG or RAD
    let currentTheme = localStorage.getItem('glowcalc-theme') || 'dark';
    let history = JSON.parse(localStorage.getItem('glowcalc-history')) || [];

    // === 3. 공학용 연산용 격리 범위 (Safe Math Scope) ===
    const MathScope = {
        sin: (x) => {
            const val = angleUnit === 'DEG' ? (x * Math.PI) / 180 : x;
            return Math.sin(val);
        },
        cos: (x) => {
            const val = angleUnit === 'DEG' ? (x * Math.PI) / 180 : x;
            return Math.cos(val);
        },
        tan: (x) => {
            const val = angleUnit === 'DEG' ? (x * Math.PI) / 180 : x;
            // tan(90도) 등 무한대 예외 처리
            if (angleUnit === 'DEG' && Math.abs(x % 180) === 90) return NaN;
            return Math.tan(val);
        },
        ln: (x) => Math.log(x),
        log: (x) => Math.log10(x),
        sqrt: (x) => {
            if (x < 0) return NaN;
            return Math.sqrt(x);
        },
        pi: Math.PI,
        e: Math.E
    };

    // === 4. 초기화 실행 ===
    initApp();

    function initApp() {
        // 테마 설정
        document.documentElement.setAttribute('data-theme', currentTheme);
        
        // 각도 단위 UI 업데이트
        angleToggle.textContent = angleUnit;
        
        // 계산 기록 렌더링
        renderHistory();
        
        // 화면 리셋
        updateDisplay();
    }

    // === 5. UI 테마 설정 및 토글 ===
    themeToggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('glowcalc-theme', currentTheme);
        triggerHapticFeedback();
    });

    // === 6. 일반 / 공학용 패널 전환 ===
    tabBasic.addEventListener('click', () => {
        tabBasic.classList.add('active');
        tabSci.classList.remove('active');
        sciPanel.classList.add('hidden');
        triggerHapticFeedback();
    });

    tabSci.addEventListener('click', () => {
        tabSci.classList.add('active');
        tabBasic.classList.remove('active');
        sciPanel.classList.remove('hidden');
        triggerHapticFeedback();
    });

    // 각도 단위 토글 (DEG <-> RAD)
    angleToggle.addEventListener('click', () => {
        angleUnit = angleUnit === 'DEG' ? 'RAD' : 'DEG';
        angleToggle.textContent = angleUnit;
        localStorage.setItem('glowcalc-angle-unit', angleUnit);
        
        // 변경 시 실시간 프리뷰 재계산
        liveEvaluate();
        triggerHapticFeedback();
    });

    // === 7. 디스플레이 컨트롤 & 포맷터 ===
    function updateDisplay() {
        // 수식 디스플레이 가독성 개선 (연산자 스페이스 조절)
        let formattedExpr = currentExpression
            .replace(/\*/g, ' × ')
            .replace(/\//g, ' ÷ ')
            .replace(/\+/g, ' + ')
            .replace(/\-/g, ' − ')
            .replace(/sqrt\(/g, '√( ')
            .replace(/pow\(/g, '^');

        displayExpr.textContent = formattedExpr;
        
        // 결과창 스크롤을 항상 오른쪽 끝으로 유지
        displayRes.scrollLeft = displayRes.scrollWidth;
    }

    // 숫자를 예쁘게 3자리마다 컴마 적용하여 포맷팅
    function formatNumber(num) {
        if (isNaN(num)) return '오류';
        if (!isFinite(num)) return 'Infinity';
        
        // 매우 크거나 작은 수의 지수 표기법 처리
        const absNum = Math.abs(num);
        if (absNum !== 0 && (absNum >= 1e12 || absNum < 1e-6)) {
            return num.toExponential(6);
        }
        
        // 부동 소수점 오차 정밀도 제어 (최대 10자리)
        const rounded = parseFloat(num.toFixed(10));
        
        // 컴마 처리 (정수 부분만 컴마 추가)
        const parts = rounded.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    }

    // === 8. 계산기 핵심 연산 파서 ===
    function parseAndEvaluate(expr) {
        if (!expr.trim()) return 0;

        try {
            let preparedExpr = expr;

            // 1. 암시적 곱셈 지원 (예: 2π -> 2 * π, 3(4) -> 3 * (4), 5sin(30) -> 5 * sin(30))
            preparedExpr = preparedExpr
                // 숫자 바로 뒤에 문자(π, e, sin 등)나 괄호가 오면 곱셈 삽입
                .replace(/(\d+(?:\.\d+)?)\s*([a-zA-Z\(πe])/g, '$1 * $2')
                // 닫는 괄호 뒤에 숫자나 문자, 여는 괄호가 오면 곱셈 삽입
                .replace(/(\))\s*(\d+(?:\.\d+)?)/g, '$1 * $2')
                .replace(/(\))\s*([a-zA-Z\(πe])/g, '$1 * $2')
                // 상수(π, e) 뒤에 문자나 여는 괄호가 오면 곱셈 삽입
                .replace(/(π|e)\s*([a-zA-Z\(])/g, '$1 * $2');

            // 2. 퍼센트(%) 기호를 /100으로 치환
            preparedExpr = preparedExpr.replace(/(\d+(?:\.\d+)?)%/g, '($1 / 100)');

            // 3. 기호 및 거듭제곱 변환
            preparedExpr = preparedExpr
                .replace(/π/g, 'pi')
                .replace(/e/g, 'e')
                .replace(/\^/g, '**');

            // 4. 공학용 함수 접두사 변환 (예: sin( -> MathScope.sin() 내에서 동작 가능하도록 범위 확장)
            preparedExpr = preparedExpr
                .replace(/sin\(/g, 'sin(')
                .replace(/cos\(/g, 'cos(')
                .replace(/tan\(/g, 'tan(')
                .replace(/ln\(/g, 'ln(')
                .replace(/log\(/g, 'log(')
                .replace(/√\(/g, 'sqrt(');

            // 5. 괄호가 열려있는데 안 닫혔을 시 수식 보정하여 닫아주기
            const openBrackets = (preparedExpr.match(/\(/g) || []).length;
            const closeBrackets = (preparedExpr.match(/\)/g) || []).length;
            if (openBrackets > closeBrackets) {
                preparedExpr += ')'.repeat(openBrackets - closeBrackets);
            }

            // 6. 격리된 샌드박스 함수 생성하여 계산 실행 (eval 대체 및 안전장치)
            const evaluator = new Function('scope', `
                with (scope) {
                    try {
                        return ${preparedExpr};
                    } catch (e) {
                        return NaN;
                    }
                }
            `);

            const result = evaluator(MathScope);
            
            if (typeof result !== 'number' || isNaN(result)) {
                return NaN;
            }
            return result;
        } catch (error) {
            return NaN;
        }
    }

    // 실시간 프리뷰 평가
    function liveEvaluate() {
        if (!currentExpression || isEvaluated) {
            evalPrev.textContent = '';
            return;
        }
        
        // 수식이 숫자 하나로만 구성된 경우 실시간 계산 안함
        if (/^-?\d+(\.\d+)?$/.test(currentExpression.trim())) {
            evalPrev.textContent = '';
            return;
        }

        const res = parseAndEvaluate(currentExpression);
        if (!isNaN(res) && isFinite(res)) {
            evalPrev.textContent = '= ' + formatNumber(res);
        } else {
            evalPrev.textContent = '';
        }
    }

    // 최종 결과 계산 실행 (= 버튼 클릭 시)
    function executeCalculation() {
        if (!currentExpression) return;

        const rawResult = parseAndEvaluate(currentExpression);
        
        if (isNaN(rawResult)) {
            displayRes.textContent = '올바르지 않은 식';
            displayRes.classList.add('error-text');
            evalPrev.textContent = '';
            isEvaluated = true;
            return;
        }

        const formattedRes = formatNumber(rawResult);
        displayRes.textContent = formattedRes;
        displayRes.classList.remove('error-text');
        evalPrev.textContent = '';

        // 계산 기록 저장
        saveToHistory(currentExpression, formattedRes);
        
        currentExpression = rawResult.toString();
        isEvaluated = true;
    }

    // === 9. 입력값 처리 핵심 로직 ===
    function handleInput(type, val, displayVal = null) {
        // 이전에 계산이 완료되었고 새 입력을 시도할 때
        if (isEvaluated) {
            if (type === 'number' || type === 'function' || val === '(' || val === 'π' || val === 'e') {
                currentExpression = '';
            }
            isEvaluated = false;
        }

        if (type === 'number') {
            // 소수점 중복 입력 방지
            if (val === '.') {
                const lastNum = currentExpression.split(/[\+\-\*\/\(\)\^]/).pop();
                if (lastNum.includes('.')) return;
            }
            currentExpression += val;
        } else if (type === 'operator') {
            // 연산자가 연속해서 입력되는 것 방지
            const lastChar = currentExpression.trim().slice(-1);
            if (['+', '-', '*', '/'].includes(lastChar)) {
                currentExpression = currentExpression.trim().slice(0, -1) + val;
            } else if (currentExpression === '' && val === '-') {
                currentExpression = '-';
            } else if (currentExpression !== '') {
                currentExpression += val;
            }
        } else if (type === 'function') {
            const funcSignature = displayVal || `${val}(`;
            currentExpression += funcSignature;
        }

        updateDisplay();
        liveEvaluate();
    }

    // 백스페이스 처리
    function handleBackspace() {
        if (isEvaluated) {
            currentExpression = '';
            isEvaluated = false;
            displayRes.textContent = '0';
            updateDisplay();
            return;
        }

        // 공학용 함수 지우기 지원 (예: sin(, cos( 등이 마지막에 있으면 한 번에 삭제)
        const functions = ['sin(', 'cos(', 'tan(', 'log(', 'ln(', 'sqrt('];
        let deleted = false;
        
        for (const func of functions) {
            if (currentExpression.endsWith(func)) {
                currentExpression = currentExpression.slice(0, -func.length);
                deleted = true;
                break;
            }
        }

        if (!deleted) {
            currentExpression = currentExpression.slice(0, -1);
        }

        if (currentExpression === '') {
            displayRes.textContent = '0';
        }

        updateDisplay();
        liveEvaluate();
    }

    // 부호 토글 (±)
    function handleNegate() {
        if (isEvaluated) {
            currentExpression = displayRes.textContent.replace(/,/g, '');
            isEvaluated = false;
        }

        if (!currentExpression) {
            currentExpression = '-';
        } else if (currentExpression === '-') {
            currentExpression = '';
        } else {
            // 수식의 마지막 단어가 숫자인 경우 찾아서 부호 반전
            const match = currentExpression.match(/(-?\d+(?:\.\d+)?)$/);
            if (match) {
                const lastNum = match[1];
                const index = currentExpression.lastIndexOf(lastNum);
                const negated = lastNum.startsWith('-') ? lastNum.slice(1) : '-' + lastNum;
                currentExpression = currentExpression.substring(0, index) + negated;
            } else {
                currentExpression += '-';
            }
        }

        updateDisplay();
        liveEvaluate();
    }

    // 퍼센트 (%) 변환
    function handlePercent() {
        if (isEvaluated) {
            currentExpression = displayRes.textContent.replace(/,/g, '');
            isEvaluated = false;
        }
        
        if (currentExpression) {
            // 수식 끝부분이 숫자인 경우 바로 뒤에 % 붙임
            if (/\d$/.test(currentExpression)) {
                currentExpression += '%';
            }
        }
        updateDisplay();
        liveEvaluate();
    }

    // 올 클리어 (AC)
    function handleClear() {
        currentExpression = '';
        isEvaluated = false;
        displayRes.textContent = '0';
        displayRes.classList.remove('error-text');
        evalPrev.textContent = '';
        updateDisplay();
    }

    // === 10. 마우스/터치 클릭 이벤트 연결 ===
    document.querySelectorAll('.key').forEach(button => {
        button.addEventListener('click', (e) => {
            triggerHapticFeedback();
            
            const numVal = button.getAttribute('data-val');
            const action = button.getAttribute('data-action');
            const displayVal = button.getAttribute('data-display');

            if (numVal) {
                handleInput('number', numVal);
            } else if (action === 'operator') {
                handleInput('operator', button.getAttribute('data-val'));
            } else if (action === 'clear') {
                handleClear();
            } else if (action === 'backspace') {
                handleBackspace();
            } else if (action === 'negate') {
                handleNegate();
            } else if (action === 'percent') {
                handlePercent();
            } else if (action === 'equals') {
                executeCalculation();
            } else if (button.classList.contains('btn-sci')) {
                handleInput('function', action, displayVal);
            }
        });
    });

    // === 11. 물리 키보드 리스너 연동 ===
    window.addEventListener('keydown', (e) => {
        let keyChar = e.key;
        let matchedBtn = null;

        // 키 맵핑
        if (keyChar >= '0' && keyChar <= '9') {
            handleInput('number', keyChar);
            matchedBtn = document.querySelector(`.key[data-val="${keyChar}"]`);
        } else if (keyChar === '.') {
            handleInput('number', '.');
            matchedBtn = document.querySelector('.key[data-val="."]');
        } else if (keyChar === '+' || keyChar === '-' || keyChar === '*' || keyChar === '/') {
            handleInput('operator', keyChar);
            matchedBtn = document.querySelector(`.key[data-action="operator"][data-val="${keyChar}"]`);
        } else if (keyChar === '%') {
            handlePercent();
            matchedBtn = document.querySelector('.key[data-action="percent"]');
        } else if (keyChar === '(' || keyChar === ')') {
            const displayChar = keyChar;
            handleInput('function', keyChar === '(' ? 'bracket-open' : 'bracket-close', displayChar);
            matchedBtn = document.querySelector(`.key[data-display="${keyChar}"]`);
        } else if (keyChar === 'Enter' || keyChar === '=') {
            e.preventDefault();
            executeCalculation();
            matchedBtn = document.querySelector('.key[data-action="equals"]');
        } else if (keyChar === 'Backspace') {
            handleBackspace();
            matchedBtn = document.querySelector('.key[data-action="backspace"]');
        } else if (keyChar === 'Escape') {
            handleClear();
            matchedBtn = document.querySelector('.key[data-action="clear"]');
        }

        // 키보드 입력 시 버튼 시각 효과 활성화
        if (matchedBtn) {
            matchedBtn.classList.add('keyboard-active');
            setTimeout(() => {
                matchedBtn.classList.remove('keyboard-active');
            }, 120);
        }
    });

    // === 12. 계산 기록 보관 로직 (History Panel) ===
    function saveToHistory(expr, res) {
        // 이미 결과에 에러가 났으면 보관하지 않음
        if (res === '오류' || res === 'Infinity' || res === 'NaN') return;

        // 중복 보관 방지 (마지막 계산과 동일하면 생략)
        if (history.length > 0 && history[0].expr === expr && history[0].res === res) return;

        history.unshift({ expr, res });
        
        // 최대 30개까지만 보존
        if (history.length > 30) {
            history.pop();
        }

        localStorage.setItem('glowcalc-history', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) {
            historyList.innerHTML = '<div class="empty-history">아직 계산 기록이 없습니다.</div>';
            return;
        }

        historyList.innerHTML = '';
        history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.setAttribute('data-index', index);

            // 가독성 높은 연산 기호 변환
            const cleanExpr = item.expr
                .replace(/\*/g, ' × ')
                .replace(/\//g, ' ÷ ')
                .replace(/\+/g, ' + ')
                .replace(/\-/g, ' − ');

            historyItem.innerHTML = `
                <div class="history-item-expr">${cleanExpr}</div>
                <div class="history-item-res">${item.res}</div>
            `;

            // 기록 클릭 시 계산기에 복원
            historyItem.addEventListener('click', () => {
                currentExpression = item.expr;
                isEvaluated = false;
                displayRes.textContent = item.res;
                updateDisplay();
                liveEvaluate();
                closeHistoryDrawer();
                triggerHapticFeedback();
            });

            historyList.appendChild(historyItem);
        });
    }

    // 기록 지우기
    clearHistoryBtn.addEventListener('click', () => {
        history = [];
        localStorage.removeItem('glowcalc-history');
        renderHistory();
        triggerHapticFeedback();
    });

    // 계산 기록 열기 / 닫기
    historyToggle.addEventListener('click', () => {
        openHistoryDrawer();
        triggerHapticFeedback();
    });

    historyClose.addEventListener('click', () => {
        closeHistoryDrawer();
        triggerHapticFeedback();
    });

    function openHistoryDrawer() {
        historyDrawer.classList.add('open');
    }

    function closeHistoryDrawer() {
        historyDrawer.classList.remove('open');
    }

    // === 13. 클립보드 복사 토스트 알림 ===
    calcDisplay.addEventListener('click', () => {
        const textToCopy = displayRes.textContent.replace(/,/g, '');
        if (textToCopy === '0' || textToCopy === '올바르지 않은 식') return;

        navigator.clipboard.writeText(textToCopy).then(() => {
            copyToast.classList.add('show');
            setTimeout(() => {
                copyToast.classList.remove('show');
            }, 2000);
            triggerHapticFeedback();
        }).catch(err => {
            console.error('클립보드 복사 실패:', err);
        });
    });

    // === 14. 햅틱 피드백 시뮬레이션 (진동/이펙트) ===
    function triggerHapticFeedback() {
        if ('vibrate' in navigator) {
            navigator.vibrate(10); // 모바일 기기에서의 미세 진동
        }
    }
});
