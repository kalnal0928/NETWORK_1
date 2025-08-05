import questions from './question.js';

// DOM 요소 추가
const questionContainer = document.getElementById('question-container');
const resultContainer = document.getElementById('result-container');
const submitButton = document.getElementById('submit-button');
const showAnswerButton = document.getElementById('show-answer-button');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const currentNumberElement = document.getElementById('current-number');
const totalQuestionsElement = document.getElementById('total-questions');
const selectionContainer = document.getElementById('selection-container'); // 새로 추가
const startButton = document.getElementById('start-button'); // 새로 추가
const quizContainer = document.getElementById('quiz-container'); // 새로 추가
const resetButton = document.getElementById('reset-button'); // 새로 추가

// 상태 변수
let currentQuestionIndex = 0;
let filteredQuestions = [];  // 빈 배열로 시작
let incorrectQuestions = []; // 틀린 문제 저장 배열
let isReviewMode = false; // 오답 복습 모드 여부
let quizStarted = false;  // 퀴즈 시작 여부 추가
let isAnswerSubmitted = false; // 답안 제출 상태 추가
let isMultipleChoiceAnswered = false; // 객관식 답변 상태 추가
let isEssayAnswerShown = false; // 서술형 정답 표시 상태 추가

document.addEventListener('DOMContentLoaded', function() {
    const selectionTypeFilter = document.getElementById('selection-type-filter');
    
    // 주관식 옵션 추가 (기존 옵션이 있다면 그 뒤에 추가)
    if (selectionTypeFilter) {
        // 기존 옵션 확인
        const hasEssayOption = Array.from(selectionTypeFilter.options)
            .some(option => option.value === 'essay');
        
        // 주관식 옵션이 없으면 추가
        if (!hasEssayOption) {
            const essayOption = document.createElement('option');
            essayOption.value = 'essay';
            essayOption.textContent = '주관식';
            selectionTypeFilter.appendChild(essayOption);
        }
    }
    
    incorrectQuestions = [];
    isReviewMode = false;
    quizStarted = false;
    
    // 선택 화면 표시, 문제 화면 숨김
    showSelectionScreen();
    
    // 이벤트 리스너 등록
    submitButton.addEventListener('click', handleSubmit);
    showAnswerButton.addEventListener('click', showAnswer);
    prevButton.addEventListener('click', showPreviousQuestion);
    nextButton.addEventListener('click', showNextQuestion);
    resetButton.addEventListener('click', resetQuiz);
    
    // 키보드 이벤트 리스너 추가 - 엔터키 처리
    document.addEventListener('keydown', function(event) {
        if (!quizStarted) return; // 퀴즈가 시작되지 않았으면 무시
        
        const currentQuestion = filteredQuestions[currentQuestionIndex];
        if (!currentQuestion) return; // 현재 문제가 없으면 무시
        
        // 숫자 키 1-4 처리 (객관식 문제일 때만)
        if (currentQuestion.type === 'multiple-choice' && !isMultipleChoiceAnswered) {
            // 숫자 키 1-4 또는 키패드 1-4
            if ((event.key >= '1' && event.key <= '4') || (event.code.startsWith('Numpad') && event.code.length === 7 && event.code[6] >= '1' && event.code[6] <= '4')) {
                event.preventDefault();
                
                // 키 값에서 숫자 추출 (1-4)
                const num = event.code.includes('Numpad') ? event.code[6] : event.key;
                const optionIndex = parseInt(num) - 1;
                
                // 해당 번호의 체크박스 찾기
                const checkboxes = document.querySelectorAll('input[name="option"]');
                if (optionIndex >= 0 && optionIndex < checkboxes.length) {
                    // 모든 체크박스 해제 후 선택한 옵션만 체크 (라디오 버튼처럼 동작)
                    checkboxes.forEach((cb, idx) => {
                        checkboxes[idx].checked = (idx === optionIndex);
                    });
                    
                    // 포커스 설정
                    checkboxes[optionIndex].focus();
                    
                    console.log(`숫자키 ${num} 입력: 옵션 ${optionIndex + 1} 선택됨`);
                    
                    // 자동으로 제출하기 (선택사항)
                    // const submitButton = document.querySelector('.submit-button');
                    // if (submitButton) {
                    //     setTimeout(() => submitButton.click(), 100);
                    // }
                }
            }
        }
        
        // 엔터키 처리
        if (event.key === 'Enter') {
            event.preventDefault(); // 기본 동작 방지 (폼 제출 등)
            console.log('엔터키 입력 감지');
            
            // 객관식 문제이고 아직 답변하지 않은 경우에만 처리
            if (currentQuestion.type === 'multiple-choice' && !isMultipleChoiceAnswered) {
                console.log('객관식 문제 제출');
                const submitButton = document.querySelector('.submit-button');
                if (submitButton) {
                    submitButton.click();
                }
            }
            // 서술형 문제인 경우
            else if (currentQuestion.type === 'essay') {
                const textarea = document.querySelector('.essay-answer');
                // 이미 정답이 표시된 상태면 다음 문제로 이동
                if (isEssayAnswerShown) {
                    console.log('다음 문제로 이동');
                    showNextQuestion();
                } 
                // 아직 답변을 제출하지 않았으면 제출 처리
                else if (textarea) {
                    console.log('서술형 문제 제출');
                    handleSubmit();
                }
            }
            // 이미 답변이 제출된 경우 다음 문제로 이동
            else if (isMultipleChoiceAnswered || isEssayAnswerShown) {
                console.log('다음 문제로 이동');
                showNextQuestion();
            }
        }
    });
    
    // 시작 버튼 이벤트 리스너 추가
    startButton.addEventListener('click', () => {
        const selectedType = selectionTypeFilter.value;
        
        if (selectedType === '선택하세요') {
            showMessage('문제 유형을 선택해주세요.', 'warning');
            return;
        }
        
        startQuiz('네트워크', selectedType);
    });
    
    if (selectionTypeFilter) {
        selectionTypeFilter.addEventListener('change', () => {
            // 필터가 변경될 때마다 문제 수 업데이트
            filterQuestions('네트워크', selectionTypeFilter.value);
        });
    }
});

// 선택 화면 표시 함수 (신규)
function showSelectionScreen() {
    selectionContainer.style.display = 'block';
    quizContainer.style.display = 'none';
}

// 필터링 함수 수정
function filterQuestions(selectedChapter, selectedType) {

    // 모든 문제를 가져옴
    let filtered = [...questions];

    // 챕터 필터링 (항상 '네트워크'로 고정)
    filtered = filtered.filter(q => q.chapter === selectedChapter);

    // 유형 필터링
    if (selectedType !== '선택하세요') {
        filtered = filtered.filter(q => q.type === selectedType);
    }

    // 필터링된 문제가 있는지 확인
    if (filtered.length === 0) {
        showMessage('선택한 조건에 맞는 문제가 없습니다.', 'warning');
        return false;
    }

    // Fisher-Yates 알고리즘을 사용하여 배열을 무작위로 섞기
    for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }

    // 필터링되고 섞인 문제 목록 저장
    filteredQuestions = filtered;
    return true;
}

// startQuiz 함수 수정
function startQuiz(chapter, type) {
    // 필터링 실행
    if (!filterQuestions(chapter, type)) {
        return;
    }

    // 퀴즈 시작 상태로 변경
    quizStarted = true;

    // 선택 화면 숨기고 퀴즈 화면 표시
    selectionContainer.style.display = 'none';
    quizContainer.style.display = 'block';

    // 첫 문제 표시
    currentQuestionIndex = 0;
    updateQuestionCounter();
    displayQuestion();
}

// 문제 표시
function displayQuestion() {
    if (filteredQuestions.length === 0) return;
    
    // 문제 유형이 바뀔 때마다 상태 초기화
    resetQuestionStates();
    
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    questionContainer.innerHTML = '';  // 컨테이너 초기화
    resultContainer.innerHTML = '';    // 결과 컨테이너 초기화
    
    // 문제 번호와 챕터 표시
    const questionMeta = document.createElement('div');
    questionMeta.className = 'question-meta';
    questionMeta.innerHTML = `<span class="chapter">${currentQuestion.chapter}</span> <span class="number">문제 ${currentQuestion.number}</span>`;
    questionContainer.appendChild(questionMeta);
    
    // 문제 텍스트 표시
    const questionText = document.createElement('h2');
    questionText.className = 'question-text';
    questionText.textContent = currentQuestion.question;
    questionContainer.appendChild(questionText);
    
    // 문제 유형에 따라 다른 UI 표시
    switch (currentQuestion.type) {
        case 'multiple-choice':
            displayMultipleChoiceQuestion(currentQuestion);
            submitButton.style.display = 'none';        // 제출 버튼 숨김
            showAnswerButton.style.display = 'none';    // 정답 보기 버튼 숨김
            break;
        
        case 'essay':
            displayEssayQuestion(currentQuestion);
            submitButton.style.display = 'block';        // 제출 버튼 표시
            showAnswerButton.style.display = 'block';    // 정답 보기 버튼 표시
            break;
    }
    
    // 버튼 상태 업데이트
    updateButtonStates();
}

// 문제 상태 초기화 함수 수정
function resetQuestionStates() {
    console.log('문제 상태 초기화');
    isAnswerSubmitted = false;
    isMultipleChoiceAnswered = false;
    isEssayAnswerShown = false;
}

// 객관식 문제 표시 함수 수정
function displayMultipleChoiceQuestion(question) {
    // 상태 초기화는 displayQuestion에서 처리하므로 여기서는 제거
    console.log('객관식 문제 표시');
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-container';
    
    // 원본 옵션과 정답을 저장
    const originalOptions = [...question.options];
    const correctAnswer = question.answer;
    
    // 옵션 배열을 섞기
    const shuffledOptions = [...originalOptions];
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }
    
    shuffledOptions.forEach((option, index) => {
        const optionLabel = document.createElement('label');
        optionLabel.className = 'option-label';
        
        const input = document.createElement('input');
        input.type = 'checkbox'; // 라디오 버튼 대신 체크박스 사용
        input.name = 'option';
        input.value = option;
        input.id = `option-${index}`;
        input.dataset.optionNumber = (index + 1).toString();
        
        // 체크박스에 변경 이벤트 리스너 추가
        input.addEventListener('change', () => {
            // 체크박스 선택 시 포커스 설정 (엔터키 입력을 위해)
            input.focus();
            console.log(`체크박스 ${index + 1} 상태 변경: ${input.checked ? '선택됨' : '선택 해제됨'}`);
        });
        
        // 키다운 이벤트는 전역 이벤트 리스너에서 처리하므로 여기서는 제거
        const labelContent = document.createElement('span');
        labelContent.innerHTML = `<span class="option-number">${index + 1}.</span> ${option}`;
        
        optionLabel.appendChild(input);
        optionLabel.appendChild(labelContent);
        optionsContainer.appendChild(optionLabel);
    });
    
    questionContainer.appendChild(optionsContainer);

    // 객관식 문제용 제출 버튼 추가
    const multipleChoiceSubmitButton = document.createElement('button');
    multipleChoiceSubmitButton.textContent = '제출';
    multipleChoiceSubmitButton.className = 'submit-button';
    multipleChoiceSubmitButton.addEventListener('click', () => {
        const selectedOptions = document.querySelectorAll('input[name="option"]:checked');
        const selectedAnswers = Array.from(selectedOptions).map(input => input.value);
        
        // 정답이 배열인지 확인
        const isCorrect = Array.isArray(correctAnswer)
            ? selectedAnswers.length === correctAnswer.length && selectedAnswers.every(answer => correctAnswer.includes(answer))
            : selectedAnswers.length === 1 && selectedAnswers[0] === correctAnswer;

        displayResult(isCorrect, selectedAnswers.join(', '), correctAnswer);

        // 모든 체크박스 비활성화
        document.querySelectorAll('input[name="option"]').forEach(checkbox => {
            checkbox.disabled = true;
        });

        // 정답인 항목 강조
        document.querySelectorAll('.option-label').forEach(label => {
            const checkboxInput = label.querySelector('input[type="checkbox"]');
            const isAnswer = Array.isArray(correctAnswer)
                ? correctAnswer.includes(checkboxInput.value)
                : checkboxInput.value === correctAnswer;

            if (isAnswer) {
                label.classList.add('correct-answer');
            }
        });

        isMultipleChoiceAnswered = true;

        if (currentQuestionIndex === filteredQuestions.length - 1) {
            setTimeout(() => {
                handleLastQuestion();
            }, 1500);
        }
    });
    questionContainer.appendChild(multipleChoiceSubmitButton);
}

// 서술형 문제 표시 함수 개선
function displayEssayQuestion(question) {
    console.log('서술형 문제 표시');
    
    const answerContainer = document.createElement('div');
    answerContainer.className = 'answer-container';
    
    // 문제 설명 추가 (선택적)
    const questionDescription = document.createElement('div');
    questionDescription.className = 'question-description';
    questionDescription.textContent = '아래 텍스트 영역에 답변을 작성하세요. Enter 키를 눌러 제출할 수 있습니다.';
    answerContainer.appendChild(questionDescription);
    
    const textarea = document.createElement('textarea');
    textarea.className = 'essay-answer';
    textarea.placeholder = '답변을 입력하세요. (Enter 키를 눌러 제출)';
    textarea.rows = 8; // 행 수 증가
    
    // 텍스트 영역에 키 이벤트 리스너 추가
    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // 기본 줄바꿈 방지
            handleSubmit(); // 제출 함수 호출
        } else if (e.key === 'Enter' && e.shiftKey) {
            // Shift+Enter는 줄바꿈 허용 (기본 동작 유지)
            console.log('줄바꿈 입력');
        }
    });
    
    answerContainer.appendChild(textarea);
    questionContainer.appendChild(answerContainer);
    
    // 텍스트 영역에 포커스 설정
    setTimeout(() => {
        textarea.focus();
    }, 100);
}

// 결과 표시 함수
function displayResult(isCorrect, userAnswer, correctAnswer) {
    resultContainer.innerHTML = '';
    
    const resultDiv = document.createElement('div');
    resultDiv.className = `result ${isCorrect ? 'correct' : 'incorrect'}`;
    
    const resultIcon = document.createElement('span');
    resultIcon.className = 'result-icon';
    resultIcon.textContent = isCorrect ? '✓' : '✗';
    
    const resultText = document.createElement('div');
    resultText.className = 'result-text';
    
    if (isCorrect) {
        resultText.innerHTML = `<p>정답입니다!</p>`;
    } else {
        resultText.innerHTML = `<p>오답입니다.</p><p>제출한 답: ${userAnswer}</p><p>정답: ${Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer}</p>`;
        
        // 오답 문제 저장 (중복 방지)
        if (!isReviewMode && !incorrectQuestions.some(q => q.number === filteredQuestions[currentQuestionIndex].number)) {
            incorrectQuestions.push(filteredQuestions[currentQuestionIndex]);
        }
    }
    
    resultDiv.appendChild(resultIcon);
    resultDiv.appendChild(resultText);
    resultContainer.appendChild(resultDiv);
    
    isAnswerSubmitted = true;
    updateButtonStates();
}

// 정답 표시 함수 개선
function showAnswer() {
    if (isEssayAnswerShown) return;
    
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    
    if (currentQuestion.type === 'essay') {
        resultContainer.innerHTML = '';
        
        const answerReveal = document.createElement('div');
        answerReveal.className = 'answer-reveal';
        
        // 마크다운 형식의 정답을 HTML로 변환하여 표시
        const formattedAnswer = currentQuestion.answer
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // 굵은 글씨 처리
            .replace(/\n\n/g, '</p><p>') // 문단 구분
            .replace(/\n/g, '<br>'); // 줄바꿈 처리
        
        answerReveal.innerHTML = `<h3>정답</h3><div class="answer-content"><p>${formattedAnswer}</p></div>`;
        
        resultContainer.appendChild(answerReveal);
        isEssayAnswerShown = true;
        isAnswerSubmitted = true;
        updateButtonStates();
    }
}

// 제출 처리 함수
function handleSubmit() {
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    
    if (currentQuestion.type === 'essay') {
        const textarea = document.querySelector('.essay-answer');
        const message = document.createElement('div');
        message.className = 'message info';
        
        if (textarea && textarea.value.trim() !== '') {
            // 답변이 있는 경우
            message.textContent = '답변이 제출되었습니다. 정답을 확인하세요.';
        } else {
            // 답변이 비어있는 경우
            message.textContent = '답변이 제출되었습니다. (빈 답변)';
        }
        
        resultContainer.innerHTML = '';
        resultContainer.appendChild(message);
        
        // 텍스트 영역 비활성화
        if (textarea) {
            textarea.disabled = true;
        }
        
        isAnswerSubmitted = true;
        isEssayAnswerShown = true; // 정답 확인 상태로 설정
        updateButtonStates();
    }
}

// 이전 문제 표시 함수
function showPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        updateQuestionCounter();
        displayQuestion();
    }
}

// 다음 문제 표시 함수
function showNextQuestion() {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
        currentQuestionIndex++;
        updateQuestionCounter();
        displayQuestion();
    } else {
        handleLastQuestion();
    }
}

// 마지막 문제 처리 함수
function handleLastQuestion() {
    // 모든 문제를 다 풀었을 때
    questionContainer.innerHTML = '';
    resultContainer.innerHTML = '';
    
    const completionMessage = document.createElement('div');
    completionMessage.className = 'message success';
    completionMessage.innerHTML = `<h2>모든 문제를 완료했습니다!</h2><p>총 ${filteredQuestions.length}개의 문제 중 ${filteredQuestions.length - incorrectQuestions.length}개를 맞추셨습니다.</p>`;
    
    questionContainer.appendChild(completionMessage);
    
    // 오답이 있는 경우 복습 버튼 표시
    if (incorrectQuestions.length > 0) {
        const reviewButton = document.createElement('button');
        reviewButton.className = 'review-button';
        reviewButton.textContent = `오답 복습하기 (${incorrectQuestions.length}문제)`;
        reviewButton.addEventListener('click', startReviewMode);
        
        questionContainer.appendChild(reviewButton);
    }
    
    // 처음으로 돌아가는 버튼
    const returnButton = document.createElement('button');
    returnButton.className = 'return-button';
    returnButton.textContent = '처음으로 돌아가기';
    returnButton.addEventListener('click', resetQuiz);
    
    questionContainer.appendChild(returnButton);
    
    // 버튼 상태 업데이트
    prevButton.style.display = 'none';
    submitButton.style.display = 'none';
    showAnswerButton.style.display = 'none';
    nextButton.style.display = 'none';
}

// 오답 복습 모드 시작 함수
function startReviewMode() {
    if (incorrectQuestions.length === 0) return;
    
    isReviewMode = true;
    filteredQuestions = [...incorrectQuestions];
    incorrectQuestions = []; // 복습 중 오답은 다시 이 배열에 추가됨
    
    currentQuestionIndex = 0;
    updateQuestionCounter();
    displayQuestion();
    
    // 복습 모드 메시지 표시
    showMessage('오답 복습 모드입니다. 틀린 문제들을 다시 풀어보세요.', 'info');
}

// 문제 카운터 업데이트 함수
function updateQuestionCounter() {
    currentNumberElement.textContent = currentQuestionIndex + 1;
    totalQuestionsElement.textContent = filteredQuestions.length;
}

// 버튼 상태 업데이트 함수
function updateButtonStates() {
    // 이전 버튼 상태
    prevButton.disabled = currentQuestionIndex === 0;
    
    // 제출 버튼 상태 (서술형 문제에만 표시)
    submitButton.disabled = isAnswerSubmitted;
    
    // 정답 보기 버튼 상태 (서술형 문제에만 표시)
    showAnswerButton.disabled = !isAnswerSubmitted || isEssayAnswerShown;
    
    // 다음 버튼 상태
    const isLastQuestion = currentQuestionIndex === filteredQuestions.length - 1;
    const canProceed = (filteredQuestions[currentQuestionIndex].type === 'multiple-choice' && isMultipleChoiceAnswered) || 
                      (filteredQuestions[currentQuestionIndex].type === 'essay' && isEssayAnswerShown);
    
    nextButton.disabled = isLastQuestion && !canProceed;
}

// 메시지 표시 함수
function showMessage(text, type = 'info') {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message ${type}`;
    messageContainer.textContent = text;
    
    resultContainer.innerHTML = '';
    resultContainer.appendChild(messageContainer);
    
    // 3초 후 메시지 자동 제거 (경고 메시지만)
    if (type === 'warning') {
        setTimeout(() => {
            if (resultContainer.contains(messageContainer)) {
                resultContainer.removeChild(messageContainer);
            }
        }, 3000);
    }
}

// 퀴즈 초기화 함수
function resetQuiz() {
    // 상태 초기화
    currentQuestionIndex = 0;
    filteredQuestions = [];
    incorrectQuestions = [];
    isReviewMode = false;
    quizStarted = false;
    isAnswerSubmitted = false;
    isMultipleChoiceAnswered = false;
    isEssayAnswerShown = false;
    
    // UI 초기화
    questionContainer.innerHTML = '';
    resultContainer.innerHTML = '';
    
    // 선택 화면으로 돌아가기
    showSelectionScreen();
}

export default {};
