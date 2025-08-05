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

// 초기화 함수 수정
function init() {
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
    
    // 시작 버튼 이벤트 리스너 추가
    startButton.addEventListener('click', () => {
        const selectedType = document.getElementById('selection-type-filter').value;
        
        if (selectedType === '선택하세요') {
            showMessage('문제 유형을 선택해주세요.', 'warning');
            return;
        }
        
        startQuiz('네트워크', selectedType);
    });
}

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
            // 즉시 정답을 확인하지 않고, 사용자가 제출 버튼을 누를 때 확인
        });
        
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



// 서술형 문제 표시 함수 수정
function displayEssayQuestion(question) {
    console.log('서술형 문제 표시');
    const essayContainer = document.createElement('div');
    essayContainer.className = 'essay-container';
    
    const textarea = document.createElement('textarea');
    textarea.className = 'essay-input';
    textarea.rows = 6;
    textarea.placeholder = '답변을 작성하세요... (엔터키로 정답 확인, 한 번 더 누르면 다음 문제)';
    
    essayContainer.appendChild(textarea);
    questionContainer.appendChild(essayContainer);
    
    // 서술형 문제에서는 제출 버튼만 표시
    submitButton.style.display = 'block';
    showAnswerButton.style.display = 'none';  // 정답 보기 버튼 숨김
    submitButton.disabled = false;

    // 자동 포커스 설정
    setTimeout(() => {
        textarea.focus();
    }, 100);
}

// 정답 검증 함수 (예시)
function checkAnswer(userAnswer, correctAnswer) {
    if (Array.isArray(correctAnswer)) {
        return correctAnswer.some(answer => 
            userAnswer.trim().toLowerCase() === answer.trim().toLowerCase());
    } else {
        return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    }
}

// 정답 제출 처리 함수 수정
function handleSubmit() {
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    let userAnswer = '';
    let isCorrect = false;
    
    switch (currentQuestion.type) {
        
            
        
            
        case 'essay':
            const essayInput = document.querySelector('.essay-input');
            if (essayInput && essayInput.value.trim()) {
                userAnswer = essayInput.value.trim();
                // 답변이 있는 경우에만 제출 상태로 변경
                isAnswerSubmitted = true;
                essayInput.disabled = true;  // 입력 필드 비활성화
            }
            // 답변 유무와 관계없이 정답 표시
            showAnswer();
            isEssayAnswerShown = true;  // 정답 표시 상태 업데이트
            return;
    }
    
    // 결과 표시
    displayResult(isCorrect, userAnswer, currentQuestion.answer);
}

// 결과 표시
function displayResult(isCorrect, userAnswer, correctAnswer) {
    resultContainer.innerHTML = '';
    
    const resultDiv = document.createElement('div');
    resultDiv.className = isCorrect ? 'result correct' : 'result incorrect';
    
    const resultIcon = document.createElement('span');
    resultIcon.className = 'result-icon';
    resultIcon.textContent = isCorrect ? '✓' : '✗';
    
    const resultText = document.createElement('p');
    resultText.className = 'result-text';
    
    // 정답이 배열인 경우 첫 번째 요소를 표시
    const displayAnswer = Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer;
    
    resultText.textContent = isCorrect 
        ? '정답입니다!' 
        : `오답입니다. 정답은 "${displayAnswer}" 입니다.`;
    
    resultDiv.appendChild(resultIcon);
    resultDiv.appendChild(resultText);
    resultContainer.appendChild(resultDiv);
    
    // 틀린 문제 저장 (오답 복습 모드가 아닐 때만)
    if (!isCorrect && !isReviewMode) {
        // 이미 저장된 문제인지 확인
        const currentQuestion = filteredQuestions[currentQuestionIndex];
        const alreadySaved = incorrectQuestions.some(q => 
            q.question === currentQuestion.question && 
            q.chapter === currentQuestion.chapter
        );
        
        if (!alreadySaved) {
            incorrectQuestions.push(currentQuestion);
        }
    }
}

// 정답 보기 함수 수정
function showAnswer() {
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    
    resultContainer.innerHTML = '';
    const answerDiv = document.createElement('div');
    answerDiv.className = 'answer-reveal';
    
    const answerTitle = document.createElement('h3');
    answerTitle.textContent = '정답:';
    
    const answerText = document.createElement('p');
    answerText.textContent = Array.isArray(currentQuestion.answer) 
        ? currentQuestion.answer.join(', ') 
        : currentQuestion.answer;
    
    answerDiv.appendChild(answerTitle);
    answerDiv.appendChild(answerText);
    resultContainer.appendChild(answerDiv);
}

// 이전 문제 표시
function showPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        updateQuestionCounter();
        displayQuestion();
    }
}

// 다음 문제 표시 함수 수정
function showNextQuestion() {
    console.log('다음 문제로 이동');
    // 상태 초기화는 displayQuestion에서 처리하므로 여기서는 제거
    
    if (currentQuestionIndex < filteredQuestions.length - 1) {
        currentQuestionIndex++;
        updateQuestionCounter();
        displayQuestion();
    } else {
        // 마지막 문제를 풀었을 때 처리
        handleLastQuestion();
    }
}

// 마지막 문제 처리 함수 추가
function handleLastQuestion() {
    // 틀린 문제가 있는지 확인
    const hasIncorrectQuestions = incorrectQuestions.length > 0;
    
    // 결과 컨테이너 초기화
    resultContainer.innerHTML = '';
    
    // 선택지를 보여주는 컨테이너 생성
    const choiceContainer = document.createElement('div');
    choiceContainer.className = 'choice-container';
    
    // 메시지 생성
    const message = document.createElement('p');
    message.className = 'message info';
    message.textContent = '모든 문제를 풀었습니다.';
    choiceContainer.appendChild(message);
    
    // 버튼 컨테이너 생성
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'action-buttons';
    
    // 틀린 문제가 있는 경우에만 오답 복습 버튼 표시
    if (hasIncorrectQuestions) {
        const reviewButton = document.createElement('button');
        reviewButton.textContent = '틀린 문제 다시 풀기';
        reviewButton.className = 'review-button';
        reviewButton.addEventListener('click', () => {
            // 오답 복습 모드로 전환
            isReviewMode = true;
            filteredQuestions = [...incorrectQuestions];
            currentQuestionIndex = 0;
            updateQuestionCounter();
            displayQuestion();
            choiceContainer.remove(); // 선택지 컨테이너 제거
        });
        buttonContainer.appendChild(reviewButton);
    }
    
    // 새로운 범위 선택 버튼
    const newRangeButton = document.createElement('button');
    newRangeButton.textContent = '새로운 범위 선택하기';
    newRangeButton.className = 'return-button';
    newRangeButton.addEventListener('click', () => {
        // 선택 화면으로 돌아가기
        resetQuiz();
        choiceContainer.remove(); // 선택지 컨테이너 제거
    });
    buttonContainer.appendChild(newRangeButton);
    
    choiceContainer.appendChild(buttonContainer);
    resultContainer.appendChild(choiceContainer);
}

// 버튼 상태 업데이트
function updateButtonStates() {
    prevButton.disabled = currentQuestionIndex === 0;
    nextButton.disabled = currentQuestionIndex === filteredQuestions.length - 1;
}

// 문제 카운터 업데이트
function updateQuestionCounter() {
    currentNumberElement.textContent = filteredQuestions.length > 0 ? currentQuestionIndex + 1 : 0;
    totalQuestionsElement.textContent = filteredQuestions.length;
}

// 메시지 표시
function showMessage(message, type = 'info') {
    resultContainer.innerHTML = '';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    resultContainer.appendChild(messageDiv);
    
    // 3초 후 메시지 삭제
    setTimeout(() => {
        if (resultContainer.contains(messageDiv)) {
            resultContainer.removeChild(messageDiv);
        }
    }, 3000);
}

// 페이지 로드 시 초기화 수정
document.addEventListener('DOMContentLoaded', function() {
    const selectionTypeFilter = document.getElementById('selection-type-filter');

    // 초기화 함수 호출
    init();
    
    if (selectionTypeFilter) {
        selectionTypeFilter.addEventListener('change', () => {
            // 필터가 변경될 때마다 문제 수 업데이트
            filterQuestions('네트워크', selectionTypeFilter.value);
        });
    }
});

// 리셋 버튼 표시 함수
function showResetButton() {
    const resetBtn = document.createElement('button');
    resetBtn.textContent = '처음으로 돌아가기';
    resetBtn.className = 'reset-button';
    resetBtn.addEventListener('click', resetQuiz);
    
    resultContainer.appendChild(resetBtn);
}

// 퀴즈 리셋 함수 수정
function resetQuiz() {
    // 상태 초기화
    incorrectQuestions = [];
    isReviewMode = false;
    quizStarted = false;
    currentQuestionIndex = 0;
    filteredQuestions = [];
    resetQuestionStates();  // 문제 상태 초기화 함수 사용
    
    // 필터 초기화
    
    document.getElementById('selection-type-filter').value = '선택하세요';
    
    // 선택 화면으로 돌아가기
    showSelectionScreen();
}

// CSS 스타일 추가
const style = document.createElement('style');
style.textContent = `
.choice-container {
    text-align: center;
    padding: 2rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    margin-top: 2rem;
}

.choice-container .message {
    margin-bottom: 1.5rem;
    font-size: 1.2rem;
}

.choice-container .action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.choice-container button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.choice-container .review-button {
    background-color: #4CAF50;
    color: white;
}

.choice-container .review-button:hover {
    background-color: #388E3C;
}

.choice-container .return-button {
    background-color: #2196F3;
    color: white;
}

.choice-container .return-button:hover {
    background-color: #1976D2;
}

.option-number {
    font-weight: bold;
    margin-right: 8px;
    color: #666;
}

.option-label {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    margin: 4px 0;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.option-label:hover {
    background-color: #f5f5f5;
}

.option-label input[type="radio"] {
    margin-right: 8px;
}
`;
document.head.appendChild(style);

// 전역 키 이벤트 리스너 수정
document.addEventListener('keydown', function(event) {
    // 퀴즈가 시작된 경우에만 처리
    if (!quizStarted) return;
    
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    if (!currentQuestion) return;

    // 엔터키 눌렸을 때 처리
    if (event.key === 'Enter') {
        event.preventDefault();
        
        // 객관식 문제 처리
        if (currentQuestion.type === 'multiple-choice') {
            // 답을 선택한 후 엔터키를 누른 경우에만 다음 문제로 이동
            if (isMultipleChoiceAnswered) {
                console.log('객관식 답변 후 엔터키: 다음 문제로 이동');
                showNextQuestion();
            }
            return;
        }
        
        

        // 서술형 문제 처리
        if (currentQuestion.type === 'essay') {
            if (isEssayAnswerShown) {
                console.log('서술형 정답 확인 후 엔터키: 다음 문제로 이동');
                showNextQuestion();
            } else {
                console.log('서술형 엔터키: 정답 확인');
                // 답변 유무와 관계없이 정답 표시
                const essayInput = document.querySelector('.essay-input');
                if (essayInput && essayInput.value.trim()) {
                    // 답변이 있는 경우 제출 처리
                    handleSubmit();
                } else {
                    // 답변이 없는 경우 정답만 표시
                    showAnswer();
                    isEssayAnswerShown = true;
                }
            }
            return;
        }
    }

    // 객관식 문제에서 숫자 키 처리 (엔터키가 아닌 경우에만)
    if (currentQuestion.type === 'multiple-choice' && !isMultipleChoiceAnswered) {
        const numKey = parseInt(event.key);
        if (numKey >= 1 && numKey <= 4) {  // 1~4 키 처리
            event.preventDefault();
            // 해당 번호의 옵션 찾기
            const targetOption = document.querySelector(`input[name="option"][data-option-number="${numKey}"]`);
            if (targetOption && !targetOption.disabled) {  // 옵션이 존재하고 비활성화되지 않은 경우
                targetOption.checked = true;
                // change 이벤트를 수동으로 발생시켜 정답 체크 로직 실행
                targetOption.dispatchEvent(new Event('change'));
            }
        }
    }
});

