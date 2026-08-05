 function showBeautifulModal(icon, title, message, primaryBtnText = 'OK', secondaryBtnText = null, onPrimaryClick = null, onSecondaryClick = null) {
    const modal = document.getElementById('beautifulModal');
    document.getElementById('beautifulModalIcon').textContent = icon;
    document.getElementById('beautifulModalTitle').textContent = title;
    document.getElementById('beautifulModalMessage').textContent = message;

    const primaryBtn = document.getElementById('beautifulModalPrimaryBtn');
    primaryBtn.textContent = primaryBtnText;

    const actions = modal.querySelector('.beautiful-modal-actions');
    const existingSecondaryBtn = actions.querySelector('.beautiful-modal-btn-secondary');
    if (existingSecondaryBtn) existingSecondaryBtn.remove();

    primaryBtn.onclick = () => {
      if (onPrimaryClick) onPrimaryClick();
      closeBeautifulModal();
    };

    if (secondaryBtnText) {
      const secondaryBtn = document.createElement('button');
      secondaryBtn.className = 'beautiful-modal-btn beautiful-modal-btn-secondary';
      secondaryBtn.textContent = secondaryBtnText;
      secondaryBtn.type = 'button';
      secondaryBtn.onclick = () => {
        if (onSecondaryClick) onSecondaryClick();
        closeBeautifulModal();
      };
      actions.appendChild(secondaryBtn);
    }

    modal.classList.add('show');
  }

  function closeBeautifulModal() {
    const modal = document.getElementById('beautifulModal');
    modal.classList.remove('show');
  }

  document.getElementById('beautifulModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeBeautifulModal();
  });

  // ==================== QUIZ DATA STRUCTURE (added) ====================
  let quizzes = [];
  let currentQuizAttempt = null;
  let quizTimerInterval = null;
  let currentQuizTopicIndex = null;
  let studentQuizResults = {};

  const DEFAULT_QUIZZES = [
    {
      id: 1,
      name: 'HTML Basics',
      icon: '🔤',
      questionsCount: 5,
      isActive: false,
      activatedAt: null,
      batchKey: null,
      questions: [
        { question: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language'], correct: 0 },
        { question: 'Which tag is used for the largest heading?', options: ['<h1>', '<h6>', '<header>', '<heading>'], correct: 0 },
        { question: 'What is the correct syntax for creating a link?', options: ['<a href="url">Link</a>', '<link url>Link</link>', '<href>Link</href>', '<url>Link</url>'], correct: 0 },
        { question: 'Which tag is used to insert an image?', options: ['<img>', '<image>', '<picture>', '<photo>'], correct: 0 },
        { question: 'What does <meta> tag define?', options: ['Metadata about HTML document', 'Metadata for meta files', 'Metadata tags', 'Meta information'], correct: 0 }
      ]
    },
    {
      id: 2,
      name: 'CSS Styling',
      icon: '🎨',
      questionsCount: 5,
      isActive: false,
      activatedAt: null,
      batchKey: null,
      questions: [
        { question: 'What does CSS stand for?', options: ['Cascading Style Sheets', 'Creative Style Sheets', 'Computer Style Sheets', 'Colorful Style Sheets'], correct: 0 },
        { question: 'Which is the correct way to style HTML with CSS?', options: [
          '<style> body {color: red;}</style>',
           '<css> body {color: red;}</css>',
           '<script> body {color: red;} /script>',
           '<link>body {color: red;}</link>'],
            correct: 0 },
        { question: 'How do you select an element with id "demo"?', options: ['#demo', '.demo', 'demo', '*demo'], correct: 0 },
        { question: 'What property is used to change text color?', options: ['color', 'text-color', 'font-color', 'text'], correct: 0 },
        { question: 'Which property controls the text size?', options: ['font-size', 'text-size', 'size', 'font'], correct: 0 }
      ]
    },
    {
      id: 3,
      name: 'JavaScript Basics',
      icon: '⚙️',
      questionsCount: 5,
      isActive: false,
      activatedAt: null,
      batchKey: null,
      questions: [
        { question: 'Inside which HTML element do we put JavaScript?', options: ['<script>', '<javascript>', '<js>', '<code>'], correct: 0 },
        { question: 'What is the correct way to write a comment in JavaScript?', options: ['// comment', '# comment', '<!-- comment -->', '* comment'], correct: 0 },
        { question: 'How do you declare a variable in JavaScript?', options: ['var x = 5;', 'variable x = 5;', 'v x = 5;', 'declare x = 5;'], correct: 0 },
        { question: 'What does JSON stand for?', options: ['JavaScript Object Notation', 'JavaScript Online Notation', 'JavaScript Object Name', 'JavaScript New Object'], correct: 0 },
        { question: 'Which method is used to access an element by id?', options: ['getElementById()', 'getElement()', 'getID()', 'getElementById'], correct: 0 }
      ]
    }
  ];

  // ==================== QUIZ MANAGEMENT (added) ====================
  function initializeQuizzes() {
    quizzes = loadFromStorage('xdev_quizzes', DEFAULT_QUIZZES);
    studentQuizResults = loadFromStorage('xdev_studentQuizResults', {});
  }

  function saveQuizzesToStorage() {
    saveToStorage('xdev_quizzes', quizzes);
  }

  function getBatchLabel(batchKey) {
    if (!batchKey) return 'Unassigned';
    if (batches[batchKey]) {
      const b = batches[batchKey];
      return `${b.label || b.days} • ${b.timing}`;
    }
    const parts = batchKey.split('-');
    return batchKey;
  }

  function populateQuizBatchSelect(selectedValue) {
    const select = document.getElementById('quizTopicBatch');
    if (!select) return;
    select.innerHTML = '<option value="">Select a batch</option>';
    Object.keys(batches).forEach(batchKey => {
      const b = batches[batchKey];
      const option = document.createElement('option');
      option.value = batchKey;
      option.textContent = `${b.label || b.days} • ${b.timing}`;
      select.appendChild(option);
    });
    if (selectedValue) select.value = selectedValue;
  }

  function openTeacherQuizzesModal() {
    initializeQuizzes();
    renderTeacherQuizzes();
    const modal = document.getElementById('teacherQuizzesModal');
    if (modal) modal.classList.add('show');
  }

  function closeTeacherQuizzesModal() {
    const modal = document.getElementById('teacherQuizzesModal');
    if (modal) modal.classList.remove('show');
  }

  function renderTeacherQuizzes() {
    const container = document.getElementById('teacherQuizTopicsContainer');
    const empty = document.getElementById('teacherQuizzesEmpty');

    if (!container) return;

    container.innerHTML = '';

    if (quizzes.length === 0) {
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';

    quizzes.forEach(quiz => {
      const isActive = quiz.isActive;
      const timeRemaining = getQuizTimeRemaining(quiz);

      const card = document.createElement('div');
      card.className = `quiz-topic-card ${!isActive ? 'disabled' : ''}`;

      let badgeHTML = '';
      if (isActive) {
        badgeHTML = `<span class="quiz-badge quiz-badge-timer">⏱️ ${timeRemaining}m</span>`;
      } else {
        badgeHTML = `<span class="quiz-badge quiz-badge-inactive">● Inactive</span>`;
      }

      card.innerHTML = `
        <div class="quiz-topic-header">
          <div class="quiz-topic-icon">${quiz.icon}</div>
          <div class="quiz-topic-info">
            <h3>${quiz.name}</h3>
            <p>${quiz.questionsCount} Questions</p>
          </div>
        </div>
        <div class="quiz-topic-footer">
          <div class="quiz-questions-count">${quiz.questionsCount} Q's</div>
          ${badgeHTML}
        </div>
        <div><span class="quiz-badge quiz-badge-batch">🎯 ${getBatchLabel(quiz.batchKey)}</span></div>
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button class="quiz-topic-btn" onclick="toggleQuizActive(${quiz.id})" style="flex: 1;">${isActive ? '⏹️ Deactivate' : '▶️ Activate'}</button>
          <button class="quiz-toggle-btn ${isActive ? 'active' : ''}" onclick="editQuizTopic(${quiz.id})">✏️ Edit</button>
        </div>
      `;

      container.appendChild(card);
    });
  }

  function getQuizTimeRemaining(quiz) {
    if (!quiz.isActive || !quiz.activatedAt) return 0;

    const elapsed = (Date.now() - new Date(quiz.activatedAt).getTime()) / (1000 * 60);
    const remaining = Math.max(0, 30 - Math.ceil(elapsed));

    if (remaining === 0) {
      quiz.isActive = false;
      saveQuizzesToStorage();
    }

    return remaining;
  }

  function toggleQuizActive(quizId) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    if (quiz.isActive) {
      quiz.isActive = false;
      quiz.activatedAt = null;
      saveQuizzesToStorage();
      renderTeacherQuizzes();
      showBeautifulModal('⏹️', 'Quiz Deactivated', `${quiz.name} has been deactivated for students.`);
    } else {
      if (!quiz.batchKey) {
        showBeautifulModal('⚠️', 'No Batch Assigned', 'Please edit this quiz and assign it to a batch before activating.');
        return;
      }
      quiz.isActive = true;
      quiz.activatedAt = new Date().toISOString();
      saveQuizzesToStorage();
      renderTeacherQuizzes();
      showBeautifulModal('▶️', 'Quiz Activated', `${quiz.name} is now active for 30 minutes. Students in batch "${getBatchLabel(quiz.batchKey)}" can take this quiz.`);
    }
  }

  function addNewQuizTopic() {
    if (Object.keys(batches).length === 0) {
      showBeautifulModal('⚠️', 'No Batches Found', 'Please admit at least one student (which creates a batch) before creating a quiz.');
      return;
    }
    clearQuizTopicForm();
    document.getElementById('quizTopicFormTitle').textContent = 'Add New Quiz Topic';
    populateQuizBatchSelect();
    document.getElementById('quizTopicForm').onsubmit = function(e) {
      e.preventDefault();
      saveNewQuizTopic();
    };
    const modal = document.getElementById('quizTopicFormModal');
    if (modal) modal.classList.add('show');
  }

  function editQuizTopic(quizId) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    document.getElementById('quizTopicFormTitle').textContent = `Edit: ${quiz.name}`;
    document.getElementById('quizTopicName').value = quiz.name;
    document.getElementById('quizTopicIcon').value = quiz.icon;
    document.getElementById('quizTopicQuestionsCount').value = quiz.questionsCount;
    document.getElementById('quizTopicQuestions').value = JSON.stringify(quiz.questions, null, 2);
    populateQuizBatchSelect(quiz.batchKey);

    document.getElementById('quizTopicForm').onsubmit = function(e) {
      e.preventDefault();
      saveEditQuizTopic(quizId);
    };

    const modal = document.getElementById('quizTopicFormModal');
    if (modal) modal.classList.add('show');
  }

  function clearQuizTopicForm() {
    document.getElementById('quizTopicForm').reset();
    document.querySelectorAll('#quizTopicForm .access-form-error').forEach(el => el.classList.remove('show'));
  }

  function closeQuizTopicForm() {
    const modal = document.getElementById('quizTopicFormModal');
    if (modal) modal.classList.remove('show');
    clearQuizTopicForm();
  }

  function saveNewQuizTopic() {
    const name = document.getElementById('quizTopicName').value.trim();
    const icon = document.getElementById('quizTopicIcon').value.trim();
    const batchKey = document.getElementById('quizTopicBatch').value;
    const questionsCount = parseInt(document.getElementById('quizTopicQuestionsCount').value);
    const questionsJSON = document.getElementById('quizTopicQuestions').value.trim();

    if (!name || !icon || !batchKey || !questionsCount || !questionsJSON) {
      showBeautifulModal('⚠️', 'Validation Error', 'Please fill in all fields correctly, including the batch assignment.');
      return;
    }

    try {
      const questions = JSON.parse(questionsJSON);
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Questions must be a non-empty array');
      }

      const newQuiz = {
        id: Math.max(...quizzes.map(q => q.id), 0) + 1,
        name: name,
        icon: icon,
        batchKey: batchKey,
        questionsCount: questionsCount,
        isActive: false,
        activatedAt: null,
        questions: questions
      };

      quizzes.push(newQuiz);
      saveQuizzesToStorage();
      closeQuizTopicForm();
      renderTeacherQuizzes();
      showBeautifulModal('✅', 'Quiz Created', `${name} has been added and assigned to batch "${getBatchLabel(batchKey)}".`);
    } catch (error) {
      showBeautifulModal('❌', 'Invalid JSON', 'Please check your questions format: ' + error.message);
    }
  }

  function saveEditQuizTopic(quizId) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    const name = document.getElementById('quizTopicName').value.trim();
    const icon = document.getElementById('quizTopicIcon').value.trim();
    const batchKey = document.getElementById('quizTopicBatch').value;
    const questionsCount = parseInt(document.getElementById('quizTopicQuestionsCount').value);
    const questionsJSON = document.getElementById('quizTopicQuestions').value.trim();

    if (!name || !icon || !batchKey || !questionsCount || !questionsJSON) {
      showBeautifulModal('⚠️', 'Validation Error', 'Please fill in all fields correctly, including the batch assignment.');
      return;
    }

    try {
      const questions = JSON.parse(questionsJSON);
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Questions must be a non-empty array');
      }

      quiz.name = name;
      quiz.icon = icon;
      quiz.batchKey = batchKey;
      quiz.questionsCount = questionsCount;
      quiz.questions = questions;

      saveQuizzesToStorage();
      closeQuizTopicForm();
      renderTeacherQuizzes();
      showBeautifulModal('✅', 'Quiz Updated', `${name} has been updated successfully.`);
    } catch (error) {
      showBeautifulModal('❌', 'Invalid JSON', 'Please check your questions format: ' + error.message);
    }
  }

  // ==================== STUDENT QUIZ FUNCTIONS (added) ====================
  function getCurrentStudentBatchKey() {
    const studentData = loadFromStorage(STUDENT_DATA_KEY, {});
    const student = students.find(s => s.id === studentData.studentId);
    if (!student) return null;
    return `${student.batchDays}-${student.batchTiming}`;
  }

  function openStudentQuizzesModal() {
    initializeQuizzes();
    renderStudentQuizzes();
    const modal = document.getElementById('studentQuizzesModal');
    if (modal) modal.classList.add('show');
  }

  function closeStudentQuizzesModal() {
    const modal = document.getElementById('studentQuizzesModal');
    if (modal) modal.classList.remove('show');
  }

  function renderStudentQuizzes() {
    const container = document.getElementById('studentQuizTopicsContainer');
    const empty = document.getElementById('studentQuizzesEmpty');

    if (!container) return;

    container.innerHTML = '';

    const studentBatchKey = getCurrentStudentBatchKey();

    const availableQuizzes = quizzes.filter(q => q.isActive && getQuizTimeRemaining(q) > 0 && q.batchKey && studentBatchKey && q.batchKey === studentBatchKey);

    if (availableQuizzes.length === 0) {
      empty.style.display = 'block';
      container.style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    container.style.display = 'grid';

    availableQuizzes.forEach((quiz) => {
      const timeRemaining = getQuizTimeRemaining(quiz);

      const card = document.createElement('div');
      card.className = 'quiz-topic-card';

      card.innerHTML = `
        <div class="quiz-topic-header">
          <div class="quiz-topic-icon">${quiz.icon}</div>
          <div class="quiz-topic-info">
            <h3>${quiz.name}</h3>
            <p>${quiz.questionsCount} Questions</p>
          </div>
        </div>
        <div class="quiz-topic-footer">
          <div class="quiz-questions-count">${quiz.questionsCount} Q's</div>
          <span class="quiz-badge quiz-badge-timer">⏱️ ${timeRemaining}m</span>
        </div>
        <button class="quiz-topic-btn" onclick="startQuiz(${quiz.id})">Start Quiz →</button>
      `;

      container.appendChild(card);
    });
  }

  function startQuiz(quizId) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    const studentBatchKey = getCurrentStudentBatchKey();
    if (!quiz.isActive || getQuizTimeRemaining(quiz) <= 0 || quiz.batchKey !== studentBatchKey) {
      showBeautifulModal('⏰', 'Quiz Not Available', 'This quiz is no longer available for your batch.');
      renderStudentQuizzes();
      return;
    }

    currentQuizAttempt = {
      quizId: quizId,
      answers: {},
      startedAt: Date.now()
    };

    currentQuizTopicIndex = quizzes.findIndex(q => q.id === quizId);
    renderQuizQuestions();
    openQuizTestModal();
    startQuizTimer();
  }

  function renderQuizQuestions() {
    const quiz = quizzes.find(q => q.id === currentQuizAttempt.quizId);
    if (!quiz) return;

    const container = document.getElementById('quizQuestionsContainer');
    container.innerHTML = '';

    document.getElementById('quizTestTitle').textContent = `${quiz.icon} ${quiz.name}`;

    quiz.questions.forEach((question, index) => {
      const questionDiv = document.createElement('div');
      questionDiv.className = 'quiz-question-container';

      let optionsHTML = '';
      question.options.forEach((option, optIndex) => {
        const isSelected = currentQuizAttempt.answers[index] === optIndex;
        optionsHTML += `
          <div class="quiz-option ${isSelected ? 'selected' : ''}" onclick="selectQuizOption(${index}, ${optIndex})">
            <div class="quiz-option-radio"></div>
            <span>${option}</span>
          </div>
        `;
      });

      questionDiv.innerHTML = `
        <div class="quiz-question-number">Question ${index + 1} of ${quiz.questions.length}</div>
        <div class="quiz-question-text">${question.question}</div>
        <div class="quiz-options">
          ${optionsHTML}
        </div>
      `;

      container.appendChild(questionDiv);
    });

    updateQuizProgress();
  }

  function selectQuizOption(questionIndex, optionIndex) {
    currentQuizAttempt.answers[questionIndex] = optionIndex;
    renderQuizQuestions();
  }

  function updateQuizProgress() {
    const quiz = quizzes.find(q => q.id === currentQuizAttempt.quizId);
    if (!quiz) return;

    const answered = Object.keys(currentQuizAttempt.answers).length;
    const total = quiz.questions.length;
    const percentage = (answered / total) * 100;

    document.getElementById('quizProgressText').textContent = `Question ${answered} of ${total}`;
    document.getElementById('quizProgressFill').style.width = percentage + '%';
  }

  function startQuizTimer() {
    let timeLeft = 30 * 60; // 30 minutes in seconds

    if (quizTimerInterval) clearInterval(quizTimerInterval);

    quizTimerInterval = setInterval(() => {
      timeLeft--;

      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      document.getElementById('quizTimer').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      if (timeLeft <= 0) {
        clearInterval(quizTimerInterval);
        submitQuizTest(true); // Auto-submit when time is up
      }
    }, 1000);
  }

  function openQuizTestModal() {
    const modal = document.getElementById('quizTestModal');
    if (modal) modal.classList.add('show');
  }

  function closeQuizTest() {
    if (currentQuizAttempt) {
      showBeautifulModal('⚠️', 'Confirm', 'Are you sure you want to exit the quiz? Your answers will not be saved.', 'Exit', 'Continue', () => {
        closeQuizTestInternal();
      });
    } else {
      closeQuizTestInternal();
    }
  }

  function closeQuizTestInternal() {
    if (quizTimerInterval) clearInterval(quizTimerInterval);
    currentQuizAttempt = null;
    const modal = document.getElementById('quizTestModal');
    if (modal) modal.classList.remove('show');
    renderStudentQuizzes();
  }

  function computeStudentOverallQuizPercentage(studentId) {
    const keys = Object.keys(studentQuizResults).filter(key => key.startsWith(`${studentId}_quiz_`));
    if (keys.length === 0) return 0;

    let totalCorrect = 0;
    let totalQuestions = 0;
    keys.forEach(key => {
      const r = studentQuizResults[key];
      totalCorrect += r.correct;
      totalQuestions += r.total;
    });

    return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 1000) / 10 : 0;
  }

  function submitQuizTest(autoSubmit = false) {
    const quiz = quizzes.find(q => q.id === currentQuizAttempt.quizId);
    if (!quiz) return;

    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    quiz.questions.forEach((question, index) => {
      if (currentQuizAttempt.answers[index] === undefined) {
        unanswered++;
      } else if (currentQuizAttempt.answers[index] === question.correct) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const total = quiz.questions.length;
    const percentage = Math.round((correct / total) * 100);

    const studentData = loadFromStorage(STUDENT_DATA_KEY, {});
    const resultKey = `${studentData.studentId}_quiz_${quiz.id}`;

    studentQuizResults[resultKey] = {
      quizId: quiz.id,
      quizName: quiz.name,
      correct: correct,
      incorrect: incorrect,
      unanswered: unanswered,
      score: correct,
      total: total,
      percentage: percentage,
      completedAt: new Date().toISOString()
    };

    // Automatically recalculate and store the student's overall quiz percentage
    const overallPercent = computeStudentOverallQuizPercentage(studentData.studentId);
    studentQuizResults[`${studentData.studentId}_overall`] = {
      overallPercentage: overallPercent,
      updatedAt: new Date().toISOString()
    };

    saveToStorage('xdev_studentQuizResults', studentQuizResults);
    updateStudentOverallQuizDisplay();

    let icon = '🎉';
    let title = 'Excellent!';
    let message = 'Great job! You\'ve successfully completed the quiz.';

    if (percentage >= 80) {
      icon = '🏆';
      title = 'Outstanding!';
      message = 'You got an amazing score! Keep it up!';
    } else if (percentage >= 60) {
      icon = '👍';
      title = 'Good Job!';
      message = 'You passed the quiz. Well done!';
    } else if (percentage >= 40) {
      icon = '📚';
      title = 'Keep Learning';
      message = 'You can do better. Review the topics and try again.';
    } else {
      icon = '💪';
      title = 'Try Again';
      message = 'Don\'t give up! Review the material and retake the quiz.';
    }

    showQuizResults(icon, title, message, correct, incorrect, unanswered, total, percentage);

    if (quizTimerInterval) clearInterval(quizTimerInterval);
    currentQuizAttempt = null;
  }

  function showQuizResults(icon, title, message, correct, incorrect, unanswered, total, percentage) {
    document.getElementById('quizResultIcon').textContent = icon;
    document.getElementById('quizResultTitle').textContent = title;
    document.getElementById('quizResultMessage').textContent = message;
    document.getElementById('quizResultScore').textContent = `Score: ${correct}/${total} (${percentage}%)`;
    document.getElementById('quizCorrectCount').textContent = correct;
    document.getElementById('quizIncorrectCount').textContent = incorrect;
    document.getElementById('quizUnansweredCount').textContent = unanswered;

    const modal = document.getElementById('quizTestModal');
    if (modal) modal.classList.remove('show');

    const resultModal = document.getElementById('quizResultModal');
    if (resultModal) resultModal.classList.add('show');
  }

  function retakeQuiz() {
    closeQuizResultInternal();
    openStudentQuizzesModal();
  }

  function closeQuizResult() {
    closeQuizResultInternal();
    openStudentQuizzesModal();
  }

  function closeQuizResultInternal() {
    const resultModal = document.getElementById('quizResultModal');
    if (resultModal) resultModal.classList.remove('show');
  }

  function updateStudentOverallQuizDisplay() {
    const studentData = loadFromStorage(STUDENT_DATA_KEY, {});
    if (!studentData.studentId) return;
    const percent = computeStudentOverallQuizPercentage(studentData.studentId);
    const el = document.getElementById('studentOverallQuizPercent');
    if (el) el.textContent = `${percent}%`;
  }
  // ==================== END QUIZ ADDITIONS ====================

  // ==================== LOGIN STATE MANAGEMENT ====================
  
  const LOGIN_KEY = 'XDev_userLoggedIn';
  const USER_DATA_KEY = 'XDev_userData';
  const STUDENT_LOGIN_KEY = 'XDev_studentLoggedIn';
  const STUDENT_DATA_KEY = 'XDev_studentData';

  // ==================== MULTI-TEACHER SUPPORT (added) ====================
  const ACTIVE_TEACHER_KEY = 'XDev_activeTeacher';
  const TEACHERS = [
    { key: 'irfan', name: 'Sir Irfan' },
    { key: 'hassam', name: 'Sir Hassam' },
    { key: 'ali_usman', name: 'Sir Ali Usman' },
    { key: 'hassan_ilyas', name: 'Sir Hassan Ilyas' },
    { key: 'furqan', name: 'Sir Furqan' }
  ];
  let selectedTeacherKey = localStorage.getItem(ACTIVE_TEACHER_KEY) || null;

  // Every storage key gets prefixed with the active teacher's key, so
  // students / quizzes / attendance / credentials / batches are fully isolated.
  function nsKey(key) {
    return `tch_${selectedTeacherKey || 'default'}__${key}`;
  }

  function renderTeacherCards() {
    const grid = document.getElementById('teacherCardsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    TEACHERS.forEach(t => {
      const card = document.createElement('div');
      card.className = 'teacher-card';
      card.onclick = () => selectTeacher(t.key);
      card.innerHTML = `<div class="teacher-icon">👨‍🏫</div><h3>${t.name}</h3>`;
      grid.appendChild(card);
    });
  }

  function selectTeacher(teacherKey) {
    selectedTeacherKey = teacherKey;
    localStorage.setItem(ACTIVE_TEACHER_KEY, teacherKey);
    accessCredentials = loadFromStorage(STORAGE_KEYS.ACCESS_CREDENTIALS, []);
    const label = document.getElementById('activeTeacherLabel');
    const t = TEACHERS.find(x => x.key === teacherKey);
    if (label && t) label.textContent = t.name;
    checkLoginState();
  }

  function changeTeacher() {
    selectedTeacherKey = null;
    localStorage.removeItem(ACTIVE_TEACHER_KEY);
    checkLoginState();
  }
  // ==================== END MULTI-TEACHER SUPPORT ====================

  function checkLoginState() {
    const teacherSelectPage = document.getElementById('teacherSelectPage');
    const signupPage = document.getElementById('signupPage');
    const banner = document.getElementById('banner');
    const mainWrapper = document.getElementById('mainWrapper');
    const studentLoginPage = document.getElementById('studentLoginPage');
    const studentDashboardPage = document.getElementById('studentDashboardPage');
    const roleSelectionPage = document.getElementById('roleSelectionPage');

    if (!selectedTeacherKey) {
      renderTeacherCards();
      if (teacherSelectPage) teacherSelectPage.classList.add('active');
      if (roleSelectionPage) roleSelectionPage.classList.remove('active');
      if (studentLoginPage) studentLoginPage.classList.remove('active');
      if (signupPage) signupPage.classList.remove('active');
      if (banner) banner.style.display = 'none';
      if (mainWrapper) mainWrapper.style.display = 'none';
      if (studentDashboardPage) studentDashboardPage.classList.remove('active');
      const splashScreen = document.getElementById('splashScreen');
      const loadingScreen = document.getElementById('loadingScreen');
      if (splashScreen) splashScreen.classList.add('hidden');
      if (loadingScreen) loadingScreen.classList.remove('show');
      return;
    }
    if (teacherSelectPage) teacherSelectPage.classList.remove('active');

    const isTeacherLoggedIn = localStorage.getItem(nsKey(LOGIN_KEY));
    const isStudentLoggedIn = localStorage.getItem(nsKey(STUDENT_LOGIN_KEY));

    if (isStudentLoggedIn) {
      // ...unchanged from here down...
      // Show student dashboard
      if (roleSelectionPage) roleSelectionPage.classList.remove('active');
      if (studentLoginPage) studentLoginPage.classList.remove('active');
      if (signupPage) signupPage.classList.remove('active');
      if (banner) banner.style.display = 'none';
      if (mainWrapper) mainWrapper.style.display = 'none';
      if (studentDashboardPage) studentDashboardPage.classList.add('active');
      const splashScreen = document.getElementById('splashScreen');
      if (splashScreen) splashScreen.classList.add('hidden');
      // Load shared data (students/batches/quizzes) so the student view has
      // everything it needs (batch-based quiz visibility, fee info, etc.)
      initializeData();
      initializeQuizzes();
      loadStudentDashboard();
    } else if (isTeacherLoggedIn) {
      // Show teacher dashboard
      if (roleSelectionPage) roleSelectionPage.classList.remove('active');
      if (studentLoginPage) studentLoginPage.classList.remove('active');
      if (signupPage) signupPage.classList.remove('active');
      if (banner) banner.style.display = 'block';
      if (mainWrapper) mainWrapper.style.display = 'flex';
      if (studentDashboardPage) studentDashboardPage.classList.remove('active');
      const splashScreen = document.getElementById('splashScreen');
      if (splashScreen) splashScreen.classList.add('hidden');
      setTimeout(() => {
        initializeData();
        renderCalendar();
        updateAttendanceCourses();
        initializeQuizzes();
      }, 500);
    } else {
      // Show role selection page
      if (roleSelectionPage) roleSelectionPage.classList.add('active');
      if (studentLoginPage) studentLoginPage.classList.remove('active');
      if (signupPage) signupPage.classList.remove('active');
      if (banner) banner.style.display = 'none';
      if (mainWrapper) mainWrapper.style.display = 'none';
      if (studentDashboardPage) studentDashboardPage.classList.remove('active');
      const splashScreen = document.getElementById('splashScreen');
      const loadingScreen = document.getElementById('loadingScreen');
      if (splashScreen) splashScreen.classList.add('hidden');
      if (loadingScreen) loadingScreen.classList.remove('show');
    }
  }

  function selectRole(role) {
    if (role === 'teacher') {
      // Show teacher signup
      const roleSelectionPage = document.getElementById('roleSelectionPage');
      const signupPage = document.getElementById('signupPage');
      if (roleSelectionPage) roleSelectionPage.classList.remove('active');
      if (signupPage) signupPage.classList.add('active');
    } else if (role === 'student') {
      // Show student login
      const roleSelectionPage = document.getElementById('roleSelectionPage');
      const studentLoginPage = document.getElementById('studentLoginPage');
      if (roleSelectionPage) roleSelectionPage.classList.remove('active');
      if (studentLoginPage) studentLoginPage.classList.add('active');
    }
  }

  function handleStudentLogin(e) {
    e.preventDefault();

    const username = document.getElementById('studentUsername').value.trim();
    const password = document.getElementById('studentPassword').value;
    const rollNo = document.getElementById('studentRollNo').value.trim();

    let isValid = true;

    if (!username) {
      showFieldError('studentUsername');
      isValid = false;
    } else clearFieldError('studentUsername');

    if (!password) {
      showFieldError('studentPassword');
      isValid = false;
    } else clearFieldError('studentPassword');

    if (!rollNo) {
      showFieldError('studentRollNo');
      isValid = false;
    } else clearFieldError('studentRollNo');

    if (!isValid) return;

    // Check if credentials match any stored access credentials
    const matchedCredential = accessCredentials.find(cred => 
      cred.username === username && 
      cred.password === password && 
      cred.rollNo === rollNo
    );

    if (!matchedCredential) {
      showErrorToast('Login Failed', 'Invalid username, password, or roll number');
      return;
    }

    showMiniLoader('Logging in...', 1500);

    setTimeout(() => {
      const studentData = {
        username: matchedCredential.username,
        rollNo: matchedCredential.rollNo,
        studentId: matchedCredential.studentId,
        loginTime: new Date().toISOString()
      };

     localStorage.setItem(nsKey(STUDENT_LOGIN_KEY), 'true');
      localStorage.setItem(nsKey(STUDENT_DATA_KEY), JSON.stringify(studentData));

      const initials = username.split('.')[0].slice(0, 2).toUpperCase();
      const studentInitials = document.getElementById('studentInitials');
      const studentNameDisplay = document.getElementById('studentNameDisplay');
      const studentWelcomeName = document.getElementById('studentWelcomeName');

      if (studentInitials) studentInitials.textContent = initials;
      if (studentNameDisplay) studentNameDisplay.textContent = username;
      if (studentWelcomeName) studentWelcomeName.textContent = username;

      showToast('Welcome! 🎉', `Login successful, ${username}!`);
      
      setTimeout(() => {
        checkLoginState();
      }, 1000);
    }, 750);
  }

  function computeStudentAttendanceStats(studentId) {
    const records = loadFromStorage(STORAGE_KEYS.ATTENDANCE, {});
    let present = 0, absent = 0, leave = 0;

    Object.keys(records).forEach(key => {
      const idx = key.lastIndexOf('-');
      const keyStudentId = key.substring(idx + 1);
      if (String(studentId) === keyStudentId) {
        const status = records[key] ? records[key].status : null;
        if (status === 'present') present++;
        else if (status === 'absent') absent++;
        else if (status === 'leave') leave++;
      }
    });

    const total = present + absent + leave;
    const percent = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
    return { present, absent, leave, total, percent };
  }

  function renderAttendanceDonut(present, absent, leave) {
    const chart = document.getElementById('attendanceDonutChart');
    if (!chart) return;
    const total = present + absent + leave;

    if (total === 0) {
      chart.style.background = 'conic-gradient(rgba(255,255,255,0.08) 0% 100%)';
      chart.dataset.presentPct = '0';
      chart.dataset.absentPct = '0';
      chart.dataset.leavePct = '0';
      return;
    }

    const presentPct = (present / total) * 100;
    const absentPct = (absent / total) * 100;
    const leavePct = (leave / total) * 100;
    const p1 = presentPct;
    const p2 = presentPct + absentPct;

    chart.style.background = `conic-gradient(var(--neon-green) 0% ${p1}%, var(--neon-pink) ${p1}% ${p2}%, var(--neon-cyan) ${p2}% 100%)`;
    chart.dataset.presentPct = presentPct.toFixed(1);
    chart.dataset.absentPct = absentPct.toFixed(1);
    chart.dataset.leavePct = leavePct.toFixed(1);
  }

  function showDonutTooltip(clientX, clientY, label, value, color) {
    const tooltip = document.getElementById('donutTooltip');
    if (!tooltip) return;
    tooltip.innerHTML = `<span style="color:${color}; font-weight:700;">${label}</span>: ${value}%`;
    tooltip.style.display = 'block';
    tooltip.style.left = (clientX + 16) + 'px';
    tooltip.style.top = (clientY - 12) + 'px';
  }

  function hideDonutTooltip() {
    const tooltip = document.getElementById('donutTooltip');
    if (tooltip) tooltip.style.display = 'none';
  }

  function initDonutHoverTooltip() {
    const chart = document.getElementById('attendanceDonutChart');
    if (!chart) return;

    chart.addEventListener('mousemove', function(e) {
      const rect = chart.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const outerR = rect.width / 2;
      const innerR = 54;

      if (dist < innerR || dist > outerR) {
        hideDonutTooltip();
        return;
      }

      let angle = (Math.atan2(dy, Math.abs(dx) < 1 ? 0 : dx) * 180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      const pct = (angle / 360) * 100;

      const presentPct = parseFloat(chart.dataset.presentPct || '0');
      const absentPct = parseFloat(chart.dataset.absentPct || '0');
      const leavePct = parseFloat(chart.dataset.leavePct || '0');
      const total = presentPct + absentPct + leavePct;

      if (total === 0) {
        hideDonutTooltip();
        return;
      }

      const p1 = presentPct;
      const p2 = presentPct + absentPct;

      if (presentPct > 0 && pct < p1) {
        showDonutTooltip(e.clientX, e.clientY, 'Present', presentPct.toFixed(1), 'var(--neon-green)');
      } else if (absentPct > 0 && pct < p2) {
        showDonutTooltip(e.clientX, e.clientY, 'Absent', absentPct.toFixed(1), 'var(--neon-pink)');
      } else {
        showDonutTooltip(e.clientX, e.clientY, 'Leave', leavePct.toFixed(1), 'var(--neon-cyan)');
      }
    });

    chart.addEventListener('mouseleave', hideDonutTooltip);

    const legendMap = { legendPresent: 'presentPct', legendAbsent: 'absentPct', legendLeave: 'leavePct' };
    const legendLabels = { legendPresent: ['Present', 'var(--neon-green)'], legendAbsent: ['Absent', 'var(--neon-pink)'], legendLeave: ['Leave', 'var(--neon-cyan)'] };
    Object.keys(legendMap).forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('mousemove', function(e) {
        const value = parseFloat(chart.dataset[legendMap[id]] || '0');
        const [label, color] = legendLabels[id];
        showDonutTooltip(e.clientX, e.clientY, label, value.toFixed(1), color);
      });
      el.addEventListener('mouseleave', hideDonutTooltip);
    });
  }

  initDonutHoverTooltip();

  function loadStudentDashboard() {
    const studentData = loadFromStorage(STUDENT_DATA_KEY, {});
    
    if (document.getElementById('studentWelcomeName')) {
      document.getElementById('studentWelcomeName').textContent = studentData.username || 'Student';
    }
    if (document.getElementById('studentNameDisplay')) {
      document.getElementById('studentNameDisplay').textContent = studentData.username || 'Student';
    }

    // Load attendance data linked to this student's actual record
    const stats = computeStudentAttendanceStats(studentData.studentId);
    if (document.getElementById('attendancePercent')) {
      document.getElementById('attendancePercent').textContent = `${stats.percent}%`;
    }
    renderAttendanceDonut(stats.present, stats.absent, stats.leave);

    // Load overall quiz percentage (auto-calculated from all attempted quizzes)
    updateStudentOverallQuizDisplay();

    // Load fee data - students may only view the Remaining Fee, never the Total Fee
    const studentRecord = students.find(s => s.id === studentData.studentId);
    if (document.getElementById('feeAmount')) {
      const remaining = studentRecord && studentRecord.remainingFee !== undefined ? studentRecord.remainingFee : 0;
      document.getElementById('feeAmount').textContent = `Rs.${remaining}`;
    }
  }

  function handleStudentLogout() {
    if (confirm('Are you sure you want to logout?')) {
     localStorage.removeItem(nsKey(STUDENT_LOGIN_KEY));
      localStorage.removeItem(nsKey(STUDENT_DATA_KEY));
      showToast('Logged out', 'See you next time!');
      setTimeout(() => {
        checkLoginState();
      }, 1500);
    }
  }

  function switchToTeacherSignup() {
    selectRole('teacher');
  }

  function saveToStorage(key, data) {
    try {
      localStorage.setItem(nsKey(key), JSON.stringify(data));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  function loadFromStorage(key, defaultValue) {
    try {
      const data = localStorage.getItem(nsKey(key));
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error('Storage error:', e);
      return defaultValue;
    }
  }

  function handleSignup(e) {
    e.preventDefault();
    const fullName = document.getElementById('signupFullName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    let isValid = true;

    if (!fullName) {
      showFieldError('signupFullName');
      isValid = false;
    } else clearFieldError('signupFullName');

    if (!email || !email.includes('@')) {
      showFieldError('signupEmail');
      isValid = false;
    } else clearFieldError('signupEmail');

    if (!phone || phone.length < 10) {
      showFieldError('signupPhone');
      isValid = false;
    } else clearFieldError('signupPhone');

    if (!password || password.length < 6) {
      showFieldError('signupPassword');
      isValid = false;
    } else clearFieldError('signupPassword');

    if (password !== confirmPassword) {
      showFieldError('signupConfirmPassword');
      isValid = false;
    } else clearFieldError('signupConfirmPassword');

    if (!isValid) return;

    const userData = {
      fullName: fullName,
      email: email,
      phone: phone,
      loginTime: new Date().toISOString()
    };

    showMiniLoader('Creating account...', 1500);

    setTimeout(() => {
    localStorage.setItem(nsKey(LOGIN_KEY), 'true');
      localStorage.setItem(nsKey(USER_DATA_KEY), JSON.stringify(userData));

      const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      const userInitials = document.getElementById('userInitials');
      const adminInitials = document.getElementById('adminInitials');
      const userNameDisplay = document.getElementById('userNameDisplay');
      const adminNameDisplay = document.getElementById('adminNameDisplay');

      if (userInitials) userInitials.textContent = initials;
      if (adminInitials) adminInitials.textContent = initials;
      if (userNameDisplay) userNameDisplay.textContent = fullName;
      if (adminNameDisplay) adminNameDisplay.textContent = fullName;

      showToast('Account Created! 🎉', `Welcome ${fullName}! Your account is ready.`);
      
      setTimeout(() => {
        checkLoginState();
      }, 1000);
    }, 750);
  }

  function showFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(`err-${fieldId}`);
    if (field) field.classList.add('error');
    if (error) error.classList.add('show');
  }

  function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(`err-${fieldId}`);
    if (field) field.classList.remove('error');
    if (error) error.classList.remove('show');
  }

  function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) field.type = field.type === 'password' ? 'text' : 'password';
  }

  // ==================== SPLASH SCREEN & LOADER FUNCTIONALITY ====================
  
  function expandLoader() {
    const logoContainer = document.getElementById('logoContainer');
    const splashScreen = document.getElementById('splashScreen');
    const loadingScreen = document.getElementById('loadingScreen');
    
    if (!logoContainer || !loadingScreen || !splashScreen) return;
    
    logoContainer.classList.add('expanding');
    
    setTimeout(() => {
      loadingScreen.classList.add('show');
    }, 300);
    
    setTimeout(() => {
      splashScreen.classList.add('hidden');
    }, 800);
    
    setTimeout(() => {
      loadingScreen.classList.remove('show');
      checkLoginState();
    }, 5000);
  }

  function showMiniLoader(text = 'Processing...', duration = 1500) {
    const miniLoader = document.getElementById('miniLoader');
    const miniLoaderText = document.getElementById('miniLoaderText');
    
    if (!miniLoader) return;
    
    if (miniLoaderText) miniLoaderText.textContent = text;
    
    miniLoader.classList.add('show');
    document.body.classList.add('loading-active');
    
    setTimeout(() => {
      miniLoader.classList.remove('show');
      document.body.classList.remove('loading-active');
    }, duration);
  }

  function showAdmissionPageWithLoader() {
    showMiniLoader('Opening form...', 1200);
    setTimeout(() => {
      showPage('admission', null);
    }, 600);
  }

  function handleSaveAdmissionWithLoader(e) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const serialNumber = document.getElementById('serialNumber').value.trim();
    const fullName = document.getElementById('fullName').value.trim();
    const cnic = document.getElementById('cnicNumber').value.trim();

    if (isDuplicateStudent(serialNumber, fullName, cnic)) {
      showErrorToast('Duplicate Entry', 'This student already exists!');
      return;
    }

    showMiniLoader('Saving admission...', 1800);
    
    setTimeout(() => {
      handleSaveAdmission(e);
    }, 900);
  }

  function saveAllAttendanceWithLoader() {
    if (!selectedAttendanceDate) {
      showErrorToast('Select Date', 'Please select a date to save attendance');
      return;
    }

    if (currentAttendanceStudents.length === 0) {
      showErrorToast('No Data', 'No students to save attendance for');
      return;
    }

    showMiniLoader('Saving attendance...', 1500);
    
    setTimeout(() => {
      saveAllAttendance();
    }, 750);
  }

  // ==================== ORIGINAL CODE (ALL LOGIC PRESERVED) ====================

  let students = [];
  let monthlyData = { students: {}, invoices: {} };
  let batches = {};
  let accessCredentials = [];
  let currentPage = 'dashboard';
  let newNotificationCount = 0;
  let currentDetailType = null;
  let currentMonthIndex = null;
  let currentCalendarMonth = new Date().getMonth();
  let currentCalendarYear = new Date().getFullYear();
  let selectedAttendanceDate = null;
  let attendanceRecords = {};
  let currentAttendanceStudents = [];
  let feeUpdateStudentId = null;
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const colors = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

  const STORAGE_KEYS = {
    STUDENTS: 'eduCenter_students',
    MONTHLY_DATA: 'eduCenter_monthlyData',
    BATCHES: 'eduCenter_batches',
    NOTIFICATIONS: 'eduCenter_notifications',
    NOTIFICATION_COUNT: 'eduCenter_notificationCount',
    ATTENDANCE: 'eduCenter_attendance',
    ACCESS_CREDENTIALS: 'eduCenter_accessCredentials'
  };

  const courseMap = {
    'W_D': 'Website Development',
    'W_P': 'WordPress',
    'html': 'HTML Fundamentals',
    'css': 'CSS Styling',
    'js': 'JavaScript Programming',
    'react': 'React.js',
    'python': 'Python Programming',
    'math': 'Mathematics'
  };

  const durationMap = {
    '1m': '1 Month',
    '3m': '3 Months',
    '6m': '6 Months',
    '1y': '1 Year'
  };

  const batchDaysMap = {
    'MWF': 'Mon, Wed, Fri',
    'TTS': 'Tue, Thu, Sat'
  };

  function initializeMonthlyData() {
    for (let i = 0; i < 12; i++) {
      if (!monthlyData.students[i]) monthlyData.students[i] = [];
      if (!monthlyData.invoices[i]) monthlyData.invoices[i] = 0;
    }
  }

  function initializeData() {
    students = loadFromStorage(STORAGE_KEYS.STUDENTS, []);
    monthlyData = loadFromStorage(STORAGE_KEYS.MONTHLY_DATA, { students: {}, invoices: {} });
    batches = loadFromStorage(STORAGE_KEYS.BATCHES, {});
    attendanceRecords = loadFromStorage(STORAGE_KEYS.ATTENDANCE, {});
    accessCredentials = loadFromStorage(STORAGE_KEYS.ACCESS_CREDENTIALS, []);

    initializeMonthlyData();

    const savedNotifications = loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, [
      {
        title: 'Welcome to ITSkills Dashboard',
        sub: 'Your attendance management system is ready to use!',
        time: 'Just now'
      }
    ]);

    newNotificationCount = loadFromStorage(STORAGE_KEYS.NOTIFICATION_COUNT, 0);

    const notifList = document.getElementById('notifList');
    if (notifList) {
      notifList.innerHTML = '';
      savedNotifications.forEach(notif => {
        const item = document.createElement('div');
        item.className = 'notif-item';
        item.innerHTML = `
          <div class="notif-dot"></div>
          <div class="notif-text">
            <div class="nt-title">${notif.title}</div>
            <div class="nt-sub">${notif.sub}</div>
          </div>
          <div class="notif-time">${notif.time}</div>
        `;
        notifList.appendChild(item);
      });
    }

    updateDashboardCounters();
    updateBadges();
  }

  function showPage(pageId, navEl) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (navEl) {
      navEl.classList.add('active');
    } else {
      const items = document.querySelectorAll('.nav-item');
      if (pageId === 'dashboard' && items[0]) items[0].classList.add('active');
      else if (pageId === 'students' && items[1]) items[1].classList.add('active');
      else if (pageId === 'attendance' && items[2]) items[2].classList.add('active');
      else if (pageId === 'quiz' && items[3]) items[3].classList.add('active');
      else if (pageId === 'notifications' && items[4]) items[4].classList.add('active');
    }

    currentPage = pageId;
    if (pageId === 'students') renderStudentsTable();
    if (pageId === 'admission') clearForm();
    if (pageId === 'attendance') {
      renderCalendar();
      updateAttendanceCourses();
    }

    window.scrollTo(0, 0);
  }

  function openStudentsPage(navEl) {
    showPage('students', navEl);
    clearBadgeOnOpen('studentsBadge');
  }

  function openNotificationsPage(navEl) {
    showPage('notifications', navEl);
    clearBadgeOnOpen('notificationsBadge');
    clearBadgeOnOpen('notifBadge');
  }

  function clearForm() {
    document.getElementById('admissionForm').reset();
    document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.field-error').forEach(el => el.classList.remove('show'));
  }

  function validateForm() {
    const fields = [
      { id: 'serialNumber', errId: 'err-serialNumber' },
      { id: 'shortName', errId: 'err-shortName' },
      { id: 'fullName', errId: 'err-fullName' },
      { id: 'fatherName', errId: 'err-fatherName' },
      { id: 'cnicNumber', errId: 'err-cnicNumber' },
      { id: 'courseName', errId: 'err-courseName' },
      { id: 'counselorName', errId: 'err-counselorName' },
      { id: 'courseDuration', errId: 'err-courseDuration' },
      { id: 'startDate', errId: 'err-startDate' },
      { id: 'endDate', errId: 'err-endDate' },
      { id: 'batchDays', errId: 'err-batchDays' },
      { id: 'batchTiming', errId: 'err-batchTiming' },
      { id: 'totalFee', errId: 'err-totalFee' },
      { id: 'remainingFee', errId: 'err-remainingFee' },
    ];

    let valid = true;
    fields.forEach(f => {
      const el = document.getElementById(f.id);
      const err = document.getElementById(f.errId);
      if (!el || !el.value.trim()) {
        if (el) el.classList.add('error');
        if (err) err.classList.add('show');
        valid = false;
      } else {
        if (el) el.classList.remove('error');
        if (err) err.classList.remove('show');
      }
    });
    return valid;
  }

  function isDuplicateStudent(serialNumber, fullName, cnic) {
    return students.some(s =>
      s.serialNumber === serialNumber ||
      (s.fullName.toLowerCase() === fullName.toLowerCase() && s.cnic === cnic)
    );
  }

  function handleSaveAdmission(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const serialNumber = document.getElementById('serialNumber').value.trim();
    const fullName = document.getElementById('fullName').value.trim();
    const cnic = document.getElementById('cnicNumber').value.trim();

    if (isDuplicateStudent(serialNumber, fullName, cnic)) {
      showErrorToast('Duplicate Entry', 'This student already exists!');
      return;
    }

    const courseValue = document.getElementById('courseName').value;
    const durationValue = document.getElementById('courseDuration').value;
    const batchDaysVal = document.getElementById('batchDays').value;
    const batchTimingVal = document.getElementById('batchTiming').value;
    const totalFeeVal = parseFloat(document.getElementById('totalFee').value) || 0;
    const remainingFeeVal = parseFloat(document.getElementById('remainingFee').value) || 0;

    const student = {
      id: Date.now(),
      serialNumber: serialNumber,
      name: document.getElementById('shortName').value.trim(),
      fullName: fullName,
      fatherName: document.getElementById('fatherName').value.trim(),
      cnic: cnic,
      course: courseValue,
      courseName: courseMap[courseValue] || courseValue,
      counselor: document.getElementById('counselorName').value,
      duration: durationMap[durationValue] || durationValue,
      startDate: document.getElementById('startDate').value,
      endDate: document.getElementById('endDate').value,
      batchDays: batchDaysVal,
      batchDaysLabel: batchDaysMap[batchDaysVal] || batchDaysVal,
      batchTiming: batchTimingVal,
      totalFee: totalFeeVal,
      remainingFee: remainingFeeVal,
      status: 'active',
      added: new Date().toISOString()
    };

    students.unshift(student);
    const month = new Date(student.added).getMonth();
    
    if (!monthlyData.students[month]) monthlyData.students[month] = [];
    monthlyData.students[month].push(student);
    
    if (!monthlyData.invoices[month]) monthlyData.invoices[month] = 0;
    monthlyData.invoices[month]++;

    const batchKey = `${batchDaysVal}-${batchTimingVal}`;
    if (!batches[batchKey]) {
      batches[batchKey] = { days: batchDaysVal, timing: batchTimingVal, count: 0, label: batchDaysMap[batchDaysVal] };
    }
    batches[batchKey].count++;

    saveToStorage(STORAGE_KEYS.STUDENTS, students);
    saveToStorage(STORAGE_KEYS.MONTHLY_DATA, monthlyData);
    saveToStorage(STORAGE_KEYS.BATCHES, batches);

    updateDashboardCounters();
    updateBadges();
    updateAttendanceCourses();

    addNotification(`New admission: ${student.fullName}`, `Enrolled in ${student.courseName}`);
    showToast('Admission Saved! 🎉', `${student.fullName} has been successfully registered.`);

    clearForm();
    setTimeout(() => showPage('dashboard', document.querySelectorAll('.nav-item')[0]), 1400);
  }

  function updateDashboardCounters() {
    const totalStudents = students.length;
    const totalStudentsEl = document.getElementById('totalStudents');
    if (totalStudentsEl) totalStudentsEl.textContent = totalStudents.toLocaleString();

    const totalAccessCredentials = accessCredentials.length;
    const totalAccessCredentialsEl = document.getElementById('totalAccessCredentials');
    if (totalAccessCredentialsEl) totalAccessCredentialsEl.textContent = totalAccessCredentials.toLocaleString();

    const invoiceTotal = Object.values(monthlyData.invoices).reduce((a, b) => a + b, 0);
    const invoiceStatusEl = document.getElementById('invoiceStatus');
    if (invoiceStatusEl) invoiceStatusEl.textContent = invoiceTotal.toLocaleString();

    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const thisMonthCount = (monthlyData.students[currentMonth] || []).length;
    const lastMonthCount = (monthlyData.students[lastMonth] || []).length;
    const percentageChange = lastMonthCount === 0 ? 0 : Math.round((thisMonthCount / lastMonthCount) * 100) - 100;

    const studentChangeEl = document.getElementById('studentChange');
    if (studentChangeEl) {
      studentChangeEl.textContent = `▲ ${Math.abs(percentageChange)}% ${percentageChange >= 0 ? 'more' : 'less'} than last month`;
    }

    const thisMonthInvoice = monthlyData.invoices[currentMonth] || 0;
    const lastMonthInvoice = monthlyData.invoices[lastMonth] || 0;
    const invoicePercentage = lastMonthInvoice === 0 ? 0 : Math.round((thisMonthInvoice / lastMonthInvoice) * 100) - 100;

    const invoiceChangeEl = document.getElementById('invoiceChange');
    if (invoiceChangeEl) {
      invoiceChangeEl.textContent = `▲ ${Math.abs(invoicePercentage)}% ${invoicePercentage >= 0 ? 'more' : 'less'} than last month`;
    }
  }

  function updateBadges() {
    const studentCount = students.length;
    const studentBadge = document.getElementById('studentsBadge');
    const notifBadge = document.getElementById('notificationsBadge');
    const topNotifBadge = document.getElementById('notifBadge');

    if (studentBadge) {
      if (studentCount > 0) {
        studentBadge.textContent = studentCount;
        studentBadge.classList.remove('hidden');
      } else {
        studentBadge.classList.add('hidden');
      }
    }

    if (notifBadge) {
      if (newNotificationCount > 0) {
        notifBadge.textContent = newNotificationCount;
        notifBadge.classList.remove('hidden');
      } else {
        notifBadge.classList.add('hidden');
      }
    }

    if (topNotifBadge) {
      if (newNotificationCount > 0) {
        topNotifBadge.textContent = newNotificationCount;
        topNotifBadge.classList.remove('hidden');
      } else {
        topNotifBadge.classList.add('hidden');
      }
    }
  }

  function clearBadgeOnOpen(badgeId) {
    const badge = document.getElementById(badgeId);
    if (badge) {
      badge.classList.add('hidden');
      badge.textContent = '0';
    }
    
    if (badgeId === 'notificationsBadge' || badgeId === 'notifBadge') {
      newNotificationCount = 0;
      saveToStorage(STORAGE_KEYS.NOTIFICATION_COUNT, 0);
      updateBadges();
    }
  }

  function getStudentStatus(endDate) {
    const today = new Date();
    const end = new Date(endDate);
    return today > end ? 'inactive' : 'active';
  }

  function deleteStudent(studentId) {
    const index = students.findIndex(s => s.id === studentId);
    if (index === -1) return;

    const student = students[index];
    const month = new Date(student.added).getMonth();
    
    students.splice(index, 1);
    monthlyData.students[month] = (monthlyData.students[month] || []).filter(s => s.id !== studentId);
    monthlyData.invoices[month] = Math.max(0, (monthlyData.invoices[month] || 0) - 1);

    const batchKey = `${student.batchDays}-${student.batchTiming}`;
    if (batches[batchKey]) {
      batches[batchKey].count--;
      if (batches[batchKey].count === 0) delete batches[batchKey];
    }

    saveToStorage(STORAGE_KEYS.STUDENTS, students);
    saveToStorage(STORAGE_KEYS.MONTHLY_DATA, monthlyData);
    saveToStorage(STORAGE_KEYS.BATCHES, batches);

    updateDashboardCounters();
    renderStudentsTable();
    updateBadges();
    showToast('Student Deleted', `${student.fullName} has been removed.`);
  }

  function handleSendMessage() {
    const msg = document.getElementById('messageText').value.trim();
    if (!msg) {
      showErrorToast('Empty Message', 'Please write a message first.');
      return;
    }

    if (students.length === 0) {
      showErrorToast('No Students', 'Please add students first to send messages.');
      return;
    }

    addNotification(`📢 Message to Students`, msg);
    document.getElementById('messageText').value = '';
    document.getElementById('charCount').textContent = '0';
    showToast('Message Sent! ✈️', `Your message has been sent to ${students.length} student${students.length > 1 ? 's' : ''}.`);
    setTimeout(() => showPage('dashboard', document.querySelectorAll('.nav-item')[0]), 1500);
  }

  function handleCancel() {
    clearForm();
    showPage('dashboard', document.querySelectorAll('.nav-item')[0]);
  }

  function showToast(title, sub) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.classList.remove('error');
    const toastTitle = document.getElementById('toastTitle');
    const toastSub = document.getElementById('toastSub');
    if (toastTitle) toastTitle.textContent = title;
    if (toastSub) toastSub.textContent = sub;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  function showErrorToast(title, sub) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.classList.add('error');
    const toastTitle = document.getElementById('toastTitle');
    const toastSub = document.getElementById('toastSub');
    if (toastTitle) toastTitle.textContent = title;
    if (toastSub) toastSub.textContent = sub;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  function addNotification(title, sub) {
    const list = document.getElementById('notifList');
    if (!list) return;
    
    const item = document.createElement('div');
    item.className = 'notif-item';
    item.innerHTML = `
      <div class="notif-dot"></div>
      <div class="notif-text">
        <div class="nt-title">${title}</div>
        <div class="nt-sub">${sub}</div>
      </div>
      <div class="notif-time">Just now</div>
    `;
    list.insertBefore(item, list.firstChild);

    const notifications = loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, []);
    notifications.unshift({ title: title, sub: sub, time: 'Just now' });
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);

    newNotificationCount++;
    saveToStorage(STORAGE_KEYS.NOTIFICATION_COUNT, newNotificationCount);

    updateBadges();
  }

  function showMonthlyDetail(type, monthIndex) {
    const modal = document.getElementById('monthlyModal');
    const monthSections = document.getElementById('monthSections');
    const monthSectionsView = document.getElementById('monthSectionsView');
    const modalTitle = document.getElementById('modalTitle');
    const monthSubtitle = document.getElementById('monthSubtitle');
    const modalDetail = document.getElementById('modalDetail');
    const detailTitle = document.getElementById('detailTitle');
    const detailList = document.getElementById('detailList');

    if (!modal || !monthSections) return;

    if (typeof monthIndex === 'number') {
      currentMonthIndex = monthIndex;
      if (monthSectionsView) monthSectionsView.style.display = 'none';
      
      if (type === 'students') {
        const monthStudents = monthlyData.students[monthIndex] || [];
        if (detailTitle) detailTitle.textContent = `${months[monthIndex]} - Students Details (${monthStudents.length} Total)`;
        if (monthSubtitle) monthSubtitle.textContent = '';
        if (detailList) {
          detailList.innerHTML = '';
          if (monthStudents.length === 0) {
            detailList.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px; color: var(--text-muted);">No students admitted in this month</td></tr>';
          } else {
            monthStudents.forEach((s, i) => {
              const row = document.createElement('tr');
              row.innerHTML = `
                <td style="padding: 14px 16px; font-size: 14px; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle);">${s.serialNumber}</td>
                <td style="padding: 14px 16px; font-size: 14px; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle); font-weight: 600;">${s.fullName}</td>
                <td style="padding: 14px 16px; font-size: 14px; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle);">${s.fatherName}</td>
                <td style="padding: 14px 16px; font-size: 14px; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle);">${s.cnic}</td>
                <td style="padding: 14px 16px; font-size: 14px; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle);">${s.courseName}</td>
                <td style="padding: 14px 16px; font-size: 14px; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle);">${s.batchDaysLabel}</td>
                <td style="padding: 14px 16px; font-size: 14px; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle);">${s.batchTiming}</td>
                <td style="padding: 14px 16px; font-size: 14px; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle);">${s.startDate}</td>
                <td style="padding: 14px 16px; font-size: 14px; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle);">
                  <button class="btn-delete" onclick="deleteStudent(${s.id})">Delete</button>
                </td>
              `;
              detailList.appendChild(row);
            });
          }
        }
      }
      if (modalDetail) modalDetail.style.display = 'block';
    } else {
      currentDetailType = type;
      if (monthSectionsView) monthSectionsView.style.display = 'block';
      if (modalDetail) modalDetail.style.display = 'none';
      monthSections.innerHTML = '';

      if (type === 'students') {
        if (modalTitle) modalTitle.textContent = 'Student Admissions by Month';
        if (monthSubtitle) monthSubtitle.textContent = 'Click on a month to see all students admitted that month';
        months.forEach((month, index) => {
          const count = (monthlyData.students[index] || []).length;
          const section = document.createElement('div');
          section.className = 'month-section';
          section.style.cursor = count > 0 ? 'pointer' : 'not-allowed';
          section.style.opacity = count > 0 ? '1' : '0.5';
          section.innerHTML = `
            <div class="month-name">${month}</div>
            <div class="month-count">${count}</div>
          `;
          if (count > 0) {
            section.onclick = () => showMonthlyDetail(type, index);
          }
          monthSections.appendChild(section);
        });
      } else if (type === 'invoice') {
        if (modalTitle) modalTitle.textContent = 'Invoice Status by Month';
        if (monthSubtitle) monthSubtitle.textContent = 'Click on a month to see invoice details';
        months.forEach((month, index) => {
          const count = monthlyData.invoices[index] || 0;
          const section = document.createElement('div');
          section.className = 'month-section';
          section.style.cursor = 'pointer';
          section.innerHTML = `
            <div class="month-name">${month}</div>
            <div class="month-count">${count}</div>
          `;
          monthSections.appendChild(section);
        });
      }
    }

    modal.classList.add('show');
  }

  function closeMonthlyModal() {
    const modal = document.getElementById('monthlyModal');
    if (modal) modal.classList.remove('show');
  }

  function renderStudentsTable() {
    const tbody = document.getElementById('studentsTableBody');
    const empty = document.getElementById('emptyStudents');
    if (!tbody || !empty) return;

    tbody.innerHTML = '';

    if (students.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    const searchInput = document.getElementById('studentSearch');
    const query = (searchInput ? searchInput.value : '').toLowerCase();
    const filtered = students.filter(s =>
      s.fullName.toLowerCase().includes(query) ||
      s.serialNumber.toLowerCase().includes(query) ||
      s.courseName.toLowerCase().includes(query) ||
      s.cnic.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      empty.style.display = 'block';
      return;
    }

    filtered.forEach((s, i) => {
      const status = getStudentStatus(s.endDate);
      const color = colors[i % colors.length];
      const initials = s.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const remainingFee = s.remainingFee !== undefined ? s.remainingFee : 0;
      const row = document.createElement('tr');
      row.style.cursor = 'pointer';
      row.title = 'Click to view attendance history';
      row.innerHTML = `
        <td style="color: var(--text-muted); font-size:13px;">${s.serialNumber}</td>
        <td>
          <div class="td-avatar">
            <div class="t-avatar" style="background:${color};">${initials}</div>
            <div>
              <div style="font-weight:600;">${s.fullName}</div>
              <div style="font-size:12px; color: var(--text-muted);">${s.cnic}</div>
            </div>
          </div>
        </td>
        <td>${s.courseName}</td>
        <td>${s.duration}</td>
        <td>${s.startDate}</td>
        <td><span class="status-badge status-${status}">● ${status === 'active' ? 'Active' : 'Inactive'}</span></td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:700; color: var(--neon-pink);">Rs.${remainingFee}</span>
            <button class="btn-sidebar" style="padding:6px 10px; font-size:11px;" onclick="event.stopPropagation(); openFeeUpdateModal(${s.id});">✏️ Update</button>
          </div>
        </td>
      `;
      row.addEventListener('click', () => openStudentAttendanceModal(s.id));
      tbody.appendChild(row);
    });
  }

  // ==================== FEE MANAGEMENT (added) ====================
  function openFeeUpdateModal(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    feeUpdateStudentId = studentId;
    document.getElementById('feeUpdateStudentName').textContent = `${student.fullName} (${student.serialNumber})`;
    document.getElementById('feeUpdateTotalFee').value = student.totalFee !== undefined ? student.totalFee : 0;
    document.getElementById('feeUpdateRemainingFee').value = student.remainingFee !== undefined ? student.remainingFee : 0;
    document.getElementById('feeUpdateRemainingFee').classList.remove('error');
    document.getElementById('err-feeUpdateRemainingFee').classList.remove('show');

    const modal = document.getElementById('feeUpdateModal');
    if (modal) modal.classList.add('show');
  }

  function closeFeeUpdateModal() {
    const modal = document.getElementById('feeUpdateModal');
    if (modal) modal.classList.remove('show');
    feeUpdateStudentId = null;
  }

  function saveFeeUpdate(e) {
    e.preventDefault();
    if (!feeUpdateStudentId) return;

    const remainingFeeInput = document.getElementById('feeUpdateRemainingFee');
    const remainingFeeVal = parseFloat(remainingFeeInput.value);

    if (isNaN(remainingFeeVal) || remainingFeeVal < 0) {
      remainingFeeInput.classList.add('error');
      document.getElementById('err-feeUpdateRemainingFee').classList.add('show');
      return;
    }

    const student = students.find(s => s.id === feeUpdateStudentId);
    if (!student) return;

    student.remainingFee = remainingFeeVal;

    // Keep the same record synced inside monthlyData.students for the admission month
    const month = new Date(student.added).getMonth();
    if (monthlyData.students[month]) {
      const monthEntry = monthlyData.students[month].find(s => s.id === student.id);
      if (monthEntry) monthEntry.remainingFee = remainingFeeVal;
    }

    saveToStorage(STORAGE_KEYS.STUDENTS, students);
    saveToStorage(STORAGE_KEYS.MONTHLY_DATA, monthlyData);

    renderStudentsTable();
    closeFeeUpdateModal();
    showToast('Fee Updated! ✓', `Remaining fee for ${student.fullName} updated to Rs.${remainingFeeVal}`);
  }

  const feeUpdateModalEl = document.getElementById('feeUpdateModal');
  if (feeUpdateModalEl) {
    feeUpdateModalEl.addEventListener('click', function(e) {
      if (e.target === this) closeFeeUpdateModal();
    });
  }
  // ==================== END FEE MANAGEMENT ====================

  function openStudentAttendanceModal(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const stats = computeStudentAttendanceStats(studentId);
    document.getElementById('studentAttendanceName').textContent = `📅 ${student.fullName}'s Attendance`;
    document.getElementById('studentAttendanceSub').textContent = `${student.serialNumber} • ${student.courseName}`;
    document.getElementById('studentAttPresentCount').textContent = stats.present;
    document.getElementById('studentAttAbsentCount').textContent = stats.absent;
    document.getElementById('studentAttLeaveCount').textContent = stats.leave;
    document.getElementById('studentAttPercent').textContent = `${stats.percent}%`;

    const records = Object.keys(attendanceRecords)
      .filter(key => key.substring(key.lastIndexOf('-') + 1) === String(studentId))
      .map(key => ({ date: key.substring(0, key.lastIndexOf('-')), status: attendanceRecords[key].status }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const listBody = document.getElementById('studentAttendanceListBody');
    const emptyState = document.getElementById('studentAttendanceEmpty');

    listBody.innerHTML = '';
    if (records.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
      records.forEach(r => {
        const statusColor = r.status === 'present' ? 'var(--neon-green)' : r.status === 'absent' ? 'var(--neon-pink)' : 'var(--neon-cyan)';
        const statusBg = r.status === 'present' ? 'rgba(6,250,165,0.15)' : r.status === 'absent' ? 'rgba(255,0,110,0.15)' : 'rgba(0,217,255,0.15)';
        const statusLabel = r.status.charAt(0).toUpperCase() + r.status.slice(1);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="padding: 10px 14px; font-size: 13px; color: var(--text-primary); border-bottom: 1px solid rgba(255,255,255,0.05);">${r.date}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.05);"><span style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; background:${statusBg}; color:${statusColor};">● ${statusLabel}</span></td>
        `;
        listBody.appendChild(tr);
      });
    }

    document.getElementById('studentAttendanceModal').classList.add('show');
  }

  function closeStudentAttendanceModal() {
    const modal = document.getElementById('studentAttendanceModal');
    if (modal) modal.classList.remove('show');
  }

  function filterStudents() {
    renderStudentsTable();
  }

  function handleGiveAccess() {
    if (students.length === 0) {
      showErrorToast('No Students', 'Please add students first to give them access.');
      return;
    }
    openAccessModal();
  }

  function openAccessModal() {
    const accessModal = document.getElementById('accessModal');
    if (accessModal) {
      accessModal.classList.add('show');
      clearAccessForm();
      populateAccessStudentSelect();
    }
  }

  function closeAccessModal() {
    const accessModal = document.getElementById('accessModal');
    if (accessModal) {
      accessModal.classList.remove('show');
      clearAccessForm();
    }
  }

  function clearAccessForm() {
    const form = document.getElementById('accessForm');
    if (form) form.reset();
    document.querySelectorAll('.access-form-input').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.access-form-error').forEach(el => el.classList.remove('show'));
  }

  function toggleAccessPasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) field.type = field.type === 'password' ? 'text' : 'password';
  }

  function populateAccessStudentSelect() {
    const select = document.getElementById('accessStudentSelect');
    if (!select) return;
    select.innerHTML = '<option value="">Select a registered student</option>';
    students.forEach(s => {
      const option = document.createElement('option');
      option.value = s.id;
      option.textContent = `${s.fullName} (${s.serialNumber})`;
      select.appendChild(option);
    });
  }

  function handleAccessStudentSelect() {
    const select = document.getElementById('accessStudentSelect');
    const rollInput = document.getElementById('accessRollNo');
    if (!select || !rollInput) return;
    const student = students.find(s => String(s.id) === select.value);
    rollInput.value = student ? student.serialNumber : '';
    if (student) {
      select.classList.remove('error');
      document.getElementById('err-accessStudentSelect').classList.remove('show');
      rollInput.classList.remove('error');
      document.getElementById('err-accessRollNo').classList.remove('show');
    }
  }

  function validateAccessForm() {
    const studentId = document.getElementById('accessStudentSelect').value;
    const username = document.getElementById('accessUsername').value.trim();
    const password = document.getElementById('accessPassword').value;
    const rollNo = document.getElementById('accessRollNo').value.trim();

    let isValid = true;

    // Validate selected student exists in the Students section
    const matchedStudent = students.find(s => String(s.id) === studentId);
    if (!studentId || !matchedStudent) {
      document.getElementById('accessStudentSelect').classList.add('error');
      document.getElementById('err-accessStudentSelect').classList.add('show');
      isValid = false;
    } else {
      document.getElementById('accessStudentSelect').classList.remove('error');
      document.getElementById('err-accessStudentSelect').classList.remove('show');
    }

    // Validate username
    if (!username || username.length < 3 || username.length > 30) {
      document.getElementById('accessUsername').classList.add('error');
      document.getElementById('err-accessUsername').classList.add('show');
      isValid = false;
    } else {
      document.getElementById('accessUsername').classList.remove('error');
      document.getElementById('err-accessUsername').classList.remove('show');
    }

    // Validate password
    if (!password || password.length < 6) {
      document.getElementById('accessPassword').classList.add('error');
      document.getElementById('err-accessPassword').classList.add('show');
      isValid = false;
    } else {
      document.getElementById('accessPassword').classList.remove('error');
      document.getElementById('err-accessPassword').classList.remove('show');
    }

    // Validate roll number (auto-filled from the selected student)
    if (!rollNo || !matchedStudent || matchedStudent.serialNumber !== rollNo) {
      document.getElementById('accessRollNo').classList.add('error');
      document.getElementById('err-accessRollNo').classList.add('show');
      isValid = false;
    } else {
      document.getElementById('accessRollNo').classList.remove('error');
      document.getElementById('err-accessRollNo').classList.remove('show');
    }

    return isValid;
  }

  function handleGrantAccess(e) {
    e.preventDefault();

    if (!validateAccessForm()) {
      return;
    }

    const studentId = document.getElementById('accessStudentSelect').value;
    const student = students.find(s => String(s.id) === studentId);
    const username = document.getElementById('accessUsername').value.trim();
    const password = document.getElementById('accessPassword').value;
    const rollNo = document.getElementById('accessRollNo').value.trim();

    showMiniLoader('Creating access credentials...', 1500);

    setTimeout(() => {
      const credential = {
        id: Date.now(),
        studentId: student.id,
        username: username,
        password: password,
        rollNo: rollNo,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      accessCredentials.unshift(credential);
      saveToStorage(STORAGE_KEYS.ACCESS_CREDENTIALS, accessCredentials);

      addNotification('📋 Access Granted', `Student ${username} (${student.fullName}, Roll: ${rollNo}) has been granted access to the system.`);
      showToast('Access Granted! ✓', `Login credentials created successfully for ${username}`);
      closeAccessModal();
    }, 750);
  }

  function viewAccessCredentials() {
    const modal = document.getElementById('credentialsModal');
    if (!modal) return;
    
    renderCredentialsTable();
    modal.classList.add('show');
  }

  function closeCredentialsModal() {
    const modal = document.getElementById('credentialsModal');
    if (modal) modal.classList.remove('show');
  }

  function renderCredentialsTable() {
    const tbody = document.getElementById('credentialsTableBody');
    const emptyState = document.getElementById('credentialsEmpty');
    
    if (!tbody || !emptyState) return;

    tbody.innerHTML = '';

    if (accessCredentials.length === 0) {
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';

    accessCredentials.forEach((cred, index) => {
      const createdDate = new Date(cred.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="padding: 14px 16px; font-size: 13px; color: var(--text-muted);">${index + 1}</td>
        <td style="padding: 14px 16px; font-size: 14px; font-weight: 600; color: var(--text-primary);">${cred.username}</td>
        <td style="padding: 14px 16px; font-size: 13px; color: var(--text-primary);">${cred.rollNo}</td>
        <td style="padding: 14px 16px; font-size: 13px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="password" value="${cred.password}" style="background: rgba(0,217,255,0.05); border: 1px solid rgba(255,255,255,0.08); padding: 6px 10px; border-radius: 6px; color: var(--text-primary); width: 120px; font-size: 12px;" readonly>
            <button onclick="togglePasswordField(this)" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 14px; transition: all 0.3s;" title="Toggle password visibility">👁️</button>
          </div>
        </td>
        <td style="padding: 14px 16px; font-size: 13px;">
          <span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: rgba(6, 250, 165, 0.15); color: var(--neon-green); border-radius: 20px; font-weight: 600; font-size: 11px;">
            ● ${cred.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td style="padding: 14px 16px; font-size: 12px; color: var(--text-secondary);">${createdDate}</td>
        <td style="padding: 14px 16px;">
          <button onclick="deleteAccessCredential(${cred.id})" style="padding: 6px 12px; background: rgba(255, 0, 110, 0.1); border: 1px solid rgba(255, 0, 110, 0.2); color: var(--neon-pink); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s;">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  function togglePasswordField(button) {
    const input = button.previousElementSibling;
    if (input.type === 'password') {
      input.type = 'text';
      button.textContent = '🙈';
    } else {
      input.type = 'password';
      button.textContent = '👁️';
    }
  }

  function deleteAccessCredential(credentialId) {
    if (!confirm('Are you sure you want to delete this access credential?')) return;

    accessCredentials = accessCredentials.filter(c => c.id !== credentialId);
    saveToStorage(STORAGE_KEYS.ACCESS_CREDENTIALS, accessCredentials);
    updateDashboardCounters();
    renderCredentialsTable();
    showToast('Credential Deleted', 'Access credential has been removed.');
  }

  function searchCredentials() {
    const searchInput = document.getElementById('credentialsSearch');
    const tbody = document.getElementById('credentialsTableBody');
    const query = (searchInput ? searchInput.value : '').toLowerCase();

    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      const username = row.cells[1]?.textContent.toLowerCase() || '';
      const rollNo = row.cells[2]?.textContent.toLowerCase() || '';
      
      if (username.includes(query) || rollNo.includes(query)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  function exportCredentials() {
    if (accessCredentials.length === 0) {
      showErrorToast('No Data', 'No credentials to export');
      return;
    }

    const data = accessCredentials.map(c => ({
      Username: c.username,
      'Roll No': c.rollNo,
      Password: c.password,
      Status: c.status,
      'Created': new Date(c.createdAt).toLocaleString()
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access_credentials_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('Exported!', `${accessCredentials.length} credentials exported as CSV`);
  }

  function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem(nsKey(LOGIN_KEY));
      localStorage.removeItem(nsKey(USER_DATA_KEY));
      showToast('Logged out', 'See you next time!');
      setTimeout(() => {
        checkLoginState();
      }, 1500);
    }
  }

  const cnicInput = document.getElementById('cnicNumber');
  if (cnicInput) {
    cnicInput.addEventListener('input', function() {
      let value = this.value.replace(/[^0-9]/g, '');
      if (value.length > 13) value = value.slice(0, 13);
      
      if (value.length <= 5) {
        this.value = value;
      } else if (value.length <= 12) {
        this.value = value.slice(0, 5) + '-' + value.slice(5);
      } else {
        this.value = value.slice(0, 5) + '-' + value.slice(5, 12) + '-' + value.slice(12, 13);
      }
    });
  }

  const modal = document.getElementById('monthlyModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeMonthlyModal();
      }
    });
  }

  const accessModal = document.getElementById('accessModal');
  if (accessModal) {
    accessModal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeAccessModal();
      }
    });
  }

  const credentialsModal = document.getElementById('credentialsModal');
  if (credentialsModal) {
    credentialsModal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeCredentialsModal();
      }
    });
  }

  const studentAttendanceModalEl = document.getElementById('studentAttendanceModal');
  if (studentAttendanceModalEl) {
    studentAttendanceModalEl.addEventListener('click', function(e) {
      if (e.target === this) {
        closeStudentAttendanceModal();
      }
    });
  }

  // ==================== ATTENDANCE FUNCTIONS ====================

  function renderCalendar() {
    const calendarMonthYear = document.getElementById('calendarMonthYear');
    const calendarDays = document.getElementById('calendarDays');

    if (!calendarMonthYear || !calendarDays) return;

    calendarMonthYear.textContent = `${months[currentCalendarMonth]} ${currentCalendarYear}`;

    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
    const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();

    calendarDays.innerHTML = '';

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = document.createElement('div');
      day.className = 'calendar-day other-month';
      day.textContent = daysInPrevMonth - i;
      calendarDays.appendChild(day);
    }

    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const day = document.createElement('div');
      day.className = 'calendar-day';
      day.textContent = i;

      const date = new Date(currentCalendarYear, currentCalendarMonth, i);
      const dateString = formatDate(date);

      if (today.getFullYear() === currentCalendarYear && today.getMonth() === currentCalendarMonth && today.getDate() === i) {
        day.classList.add('today');
      }

      if (selectedAttendanceDate === dateString) {
        day.classList.add('selected');
      }

      day.onclick = () => selectAttendanceDate(dateString, day);
      calendarDays.appendChild(day);
    }

    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
      const day = document.createElement('div');
      day.className = 'calendar-day other-month';
      day.textContent = i;
      calendarDays.appendChild(day);
    }
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function selectAttendanceDate(dateString, element) {
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
    element.classList.add('selected');

    selectedAttendanceDate = dateString;
    const dateDisplay = document.getElementById('attendanceDateDisplay');
    if (dateDisplay) {
      const date = new Date(dateString + 'T00:00:00');
      dateDisplay.textContent = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    loadAttendanceStudents();
    updateAttendanceSummary();
  }

  function prevMonth() {
    currentCalendarMonth--;
    if (currentCalendarMonth < 0) {
      currentCalendarMonth = 11;
      currentCalendarYear--;
    }
    renderCalendar();
  }

  function nextMonth() {
    currentCalendarMonth++;
    if (currentCalendarMonth > 11) {
      currentCalendarMonth = 0;
      currentCalendarYear++;
    }
    renderCalendar();
  }

  function updateAttendanceCourses() {
    const courseSelect = document.getElementById('attendanceCourse');
    if (!courseSelect) return;

    const uniqueCourses = {};
    students.forEach(s => {
      uniqueCourses[s.course] = s.courseName;
    });

    courseSelect.innerHTML = '<option value="">Select course</option>';
    Object.keys(uniqueCourses).forEach(courseCode => {
      const option = document.createElement('option');
      option.value = courseCode;
      option.textContent = uniqueCourses[courseCode];
      courseSelect.appendChild(option);
    });
  }

  function updateAttendanceBatches() {
    const courseSelect = document.getElementById('attendanceCourse');
    const batchSelect = document.getElementById('attendanceBatch');
    if (!courseSelect || !batchSelect) return;

    const selectedCourse = courseSelect.value;
    const uniqueBatches = {};

    students.forEach(s => {
      if (s.course === selectedCourse) {
        const batchKey = `${s.batchDays}||${s.batchTiming}`;
        uniqueBatches[batchKey] = s.batchTiming;
      }
    });

    batchSelect.innerHTML = '<option value="">Select batch</option>';
    Object.keys(uniqueBatches).forEach(batchKey => {
      const option = document.createElement('option');
      option.value = batchKey;
      option.textContent = uniqueBatches[batchKey];
      batchSelect.appendChild(option);
    });

    batchSelect.value = '';
    loadAttendanceStudents();
  }

  function loadAttendanceStudents() {
    const courseSelect = document.getElementById('attendanceCourse');
    const batchSelect = document.getElementById('attendanceBatch');
    const attendanceList = document.getElementById('attendanceList');

    if (!courseSelect || !batchSelect || !attendanceList) return;

    const selectedCourse = courseSelect.value;
    const selectedBatch = batchSelect.value;

    if (!selectedCourse || !selectedBatch) {
      attendanceList.innerHTML = `
        <div class="attendance-empty">
          <div class="attendance-empty-icon">📋</div>
          <p>Select a course and batch to mark attendance</p>
        </div>
      `;
      currentAttendanceStudents = [];
      return;
    }

    const [batchDays, batchTiming] = selectedBatch.split('||');
    currentAttendanceStudents = students.filter(s => 
      s.course === selectedCourse && 
      s.batchDays === batchDays && 
      s.batchTiming === batchTiming
    );

    if (currentAttendanceStudents.length === 0) {
      attendanceList.innerHTML = `
        <div class="attendance-empty">
          <div class="attendance-empty-icon">👥</div>
          <p>No students in this batch</p>
        </div>
      `;
      return;
    }

    renderAttendanceList();
  }

  function renderAttendanceList() {
    const attendanceList = document.getElementById('attendanceList');
    if (!attendanceList || !selectedAttendanceDate) return;

    attendanceList.innerHTML = '';

    currentAttendanceStudents.forEach((student, index) => {
      const recordKey = `${selectedAttendanceDate}-${student.id}`;
      const record = attendanceRecords[recordKey] || { status: null };

      const initials = student.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const color = colors[index % colors.length];

      const item = document.createElement('div');
      item.className = 'attendance-item';
      item.innerHTML = `
        <div class="attendance-item-number">${index + 1}</div>
        <div class="attendance-item-avatar" style="background-color: ${color};">${initials}</div>
        <div class="attendance-item-info">
          <div class="attendance-item-name">${student.fullName}</div>
          <div class="attendance-item-email">${student.serialNumber}</div>
        </div>
        <div class="attendance-item-actions">
          <button class="att-status-btn ${record.status === 'present' ? 'present' : ''}" onclick="markAttendance(${student.id}, 'present', this)" title="Mark Present">
            <span>✓</span> Present
          </button>
          <button class="att-status-btn ${record.status === 'absent' ? 'absent' : ''}" onclick="markAttendance(${student.id}, 'absent', this)" title="Mark Absent">
            <span>✕</span> Absent
          </button>
          <button class="att-status-btn ${record.status === 'leave' ? 'leave' : ''}" onclick="markAttendance(${student.id}, 'leave', this)" title="Mark Leave">
            <span>⊘</span> Leave
          </button>
        </div>
      `;

      attendanceList.appendChild(item);
    });
  }

  function markAttendance(studentId, status, buttonElement) {
    if (!selectedAttendanceDate) {
      showErrorToast('Select Date', 'Please select a date first');
      return;
    }

    const recordKey = `${selectedAttendanceDate}-${studentId}`;
    
    if (attendanceRecords[recordKey]?.status === status) {
      delete attendanceRecords[recordKey];
    } else {
      attendanceRecords[recordKey] = { status: status };
    }

    renderAttendanceList();
    updateAttendanceSummary();
  }

  function markAllPresent() {
    if (!selectedAttendanceDate || currentAttendanceStudents.length === 0) {
      showErrorToast('Select Date and Batch', 'Please select both date and batch first');
      return;
    }

    currentAttendanceStudents.forEach(student => {
      const recordKey = `${selectedAttendanceDate}-${student.id}`;
      attendanceRecords[recordKey] = { status: 'present' };
    });

    renderAttendanceList();
    updateAttendanceSummary();
    showToast('Marked Present', 'All students marked as present');
  }

  function markAllAbsent() {
    if (!selectedAttendanceDate || currentAttendanceStudents.length === 0) {
      showErrorToast('Select Date and Batch', 'Please select both date and batch first');
      return;
    }

    currentAttendanceStudents.forEach(student => {
      const recordKey = `${selectedAttendanceDate}-${student.id}`;
      attendanceRecords[recordKey] = { status: 'absent' };
    });

    renderAttendanceList();
    updateAttendanceSummary();
    showToast('Marked Absent', 'All students marked as absent');
  }

  function resetAttendance() {
    if (!selectedAttendanceDate || currentAttendanceStudents.length === 0) {
      showErrorToast('Select Date and Batch', 'Please select both date and batch first');
      return;
    }

    currentAttendanceStudents.forEach(student => {
      const recordKey = `${selectedAttendanceDate}-${student.id}`;
      delete attendanceRecords[recordKey];
    });

    renderAttendanceList();
    updateAttendanceSummary();
    showToast('Reset', 'Attendance has been reset');
  }

  function updateAttendanceSummary() {
    if (!selectedAttendanceDate) {
      document.getElementById('summaryPresent').textContent = '0';
      document.getElementById('summaryAbsent').textContent = '0';
      document.getElementById('summaryLeave').textContent = '0';
      return;
    }

    let presentCount = 0, absentCount = 0, leaveCount = 0;

    currentAttendanceStudents.forEach(student => {
      const recordKey = `${selectedAttendanceDate}-${student.id}`;
      const record = attendanceRecords[recordKey];
      if (record) {
        if (record.status === 'present') presentCount++;
        else if (record.status === 'absent') absentCount++;
        else if (record.status === 'leave') leaveCount++;
      }
    });

    document.getElementById('summaryPresent').textContent = presentCount;
    document.getElementById('summaryAbsent').textContent = absentCount;
    document.getElementById('summaryLeave').textContent = leaveCount;
  }

  function saveAllAttendance() {
    if (!selectedAttendanceDate) {
      showErrorToast('Select Date', 'Please select a date to save attendance');
      return;
    }

    if (currentAttendanceStudents.length === 0) {
      showErrorToast('No Data', 'No students to save attendance for');
      return;
    }

    saveToStorage(STORAGE_KEYS.ATTENDANCE, attendanceRecords);
    showToast('Saved! ✓', 'Attendance has been saved successfully');
  }

  // Initialize on page load
  window.addEventListener('load', () => {
    // Load access credentials for student login validation
    accessCredentials = loadFromStorage(STORAGE_KEYS.ACCESS_CREDENTIALS, []);
    initializeQuizzes();
    checkLoginState();
  });

  // Close new quiz-related modals when clicking outside (added)
  document.getElementById('studentQuizzesModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeStudentQuizzesModal();
  });

  document.getElementById('teacherQuizzesModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeTeacherQuizzesModal();
  });

  document.getElementById('quizTopicFormModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeQuizTopicForm();
  });

  document.getElementById('quizTestModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeQuizTest();
  });

  document.getElementById('quizResultModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeQuizResultInternal();
  });

  // ? for my cursor

  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');
  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0, lastParticleTime = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';
    if (Date.now() - lastParticleTime > 40) {
      lastParticleTime = Date.now();
      const p = document.createElement('div');
      p.className = 'cursor-particle';
      p.style.left = mouseX + 'px';
      p.style.top = mouseY + 'px';
      document.body.appendChild(p);
      const angle = Math.random() * Math.PI * 2, dist = 10 + Math.random() * 20;
      p.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.8 },
        { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0)`, opacity: 0 }
      ], { duration: 500, easing: 'ease-out' }).onfinish = () => p.remove();
    }
  });

  (function animateRing() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';
    requestAnimationFrame(animateRing);
  })();

 document.addEventListener('mouseover', (e) => {
  if (e.target.closest('button, a, .role-card, .stat-card, .nav-item, .quiz-topic-card, .teacher-card, .att-status-btn')) {
    cursorRing.classList.add('hover');
  }
});
document.addEventListener('mouseout', (e) => {
  if (e.target.closest('button, a, .role-card, .stat-card, .nav-item, .quiz-topic-card, .teacher-card, .att-status-btn')) {
    cursorRing.classList.remove('hover');
  }
});