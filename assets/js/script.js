// 객관식 문제 표시 함수 내부의 체크박스 이벤트 리스너 수정
input.addEventListener('change', () => {
    // 체크박스 선택 시 포커스 설정 (엔터키 입력을 위해)
    input.focus();
    
    // 체크박스 선택 후 엔터키 이벤트 추가 (한 번만 실행되는 이벤트)
    const handleEnterKey = function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const submitButton = document.querySelector('.submit-button');
            if (submitButton) {
                submitButton.click();
            }
            // 이벤트 리스너 제거 (한 번만 실행)
            input.removeEventListener('keydown', handleEnterKey);
        }
    };
    
    // 키다운 이벤트 리스너 추가
    input.addEventListener('keydown', handleEnterKey);
});

