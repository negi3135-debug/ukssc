/**
 * UK Exam Hub - Interactive Timed Mock Test Engine
 * Supporting UKPSC & UKSSC format, 0.25 negative marking, dynamic palette & instant analytics.
 */

const QuizEngine = {
  // Test State
  questions: [],
  currentIndex: 0,
  userAnswers: {}, // { [questionId]: optionIndex }
  reviewList: new Set(), // Set of questionIds marked for review
  visitedList: new Set(), // Set of questionIds visited
  timerInterval: null,
  totalTimeSeconds: 15 * 60, // Default 15 mins
  remainingSeconds: 15 * 60,
  startTime: null,
  isTestActive: false,

  // Configuration
  marking: {
    correct: 1.0,
    negative: 0.25
  },

  /**
   * Launch Test with configured questions
   */
  startTest(questionPool, durationMinutes = 15) {
    if (!questionPool || questionPool.length === 0) {
      alert('No questions available to start the test.');
      return;
    }

    // Shuffle questions slightly for variety
    this.questions = [...questionPool].sort(() => Math.random() - 0.5);
    this.currentIndex = 0;
    this.userAnswers = {};
    this.reviewList.clear();
    this.visitedList.clear();
    this.visitedList.add(this.questions[0].id);
    
    this.totalTimeSeconds = durationMinutes * 60;
    this.remainingSeconds = this.totalTimeSeconds;
    this.startTime = Date.now();
    this.isTestActive = true;

    // Render Test Arena Modal / Overlay
    this.renderTestArena();
    this.startTimer();
    this.renderCurrentQuestion();
    this.updatePalette();
  },

  /**
   * Start Timer Countdown
   */
  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      this.updateTimerDisplay();

      if (this.remainingSeconds <= 0) {
        clearInterval(this.timerInterval);
        this.submitTest(true); // Auto-submit
      }
    }, 1000);
  },

  /**
   * Update Timer UI
   */
  updateTimerDisplay() {
    const timerElem = document.getElementById('quizTimerDisplay');
    if (!timerElem) return;

    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    timerElem.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Urgency warning when < 2 mins
    if (this.remainingSeconds <= 120) {
      timerElem.classList.add('text-red-500', 'animate-pulse');
      timerElem.classList.remove('text-emerald-600', 'dark:text-emerald-400');
    } else {
      timerElem.classList.remove('text-red-500', 'animate-pulse');
      timerElem.classList.add('text-emerald-600', 'dark:text-emerald-400');
    }
  },

  /**
   * Render Test Arena Template
   */
  renderTestArena() {
    let arena = document.getElementById('quizTestArenaModal');
    if (!arena) {
      arena = document.createElement('div');
      arena.id = 'quizTestArenaModal';
      document.body.appendChild(arena);
    }

    arena.className = 'fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between overflow-hidden';
    arena.innerHTML = `
      <!-- Arena Header -->
      <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
            <i class="fa-solid fa-graduation-cap"></i>
          </div>
          <div>
            <h2 class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">UKPSC & UKSSC Full Mock Test</h2>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Total: ${this.questions.length} Questions | Mark: +1.0, -0.25</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <!-- Timer Display -->
          <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <i class="fa-regular fa-clock text-slate-400 text-sm"></i>
            <span id="quizTimerDisplay" class="font-mono text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">15:00</span>
          </div>

          <!-- Submit Button -->
          <button 
            onclick="QuizEngine.confirmSubmit()" 
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition flex items-center gap-1.5">
            <i class="fa-solid fa-check-double"></i>
            <span>Submit Test</span>
          </button>
        </div>
      </header>

      <!-- Main Layout: Question Area + Palette Sidebar -->
      <div class="flex-grow flex flex-col md:flex-row overflow-hidden max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        
        <!-- Left: Question Container -->
        <div class="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between overflow-y-auto p-5 sm:p-8">
          <div id="quizQuestionBody" class="space-y-6">
            <!-- Dynamic Question Content Injected Here -->
          </div>

          <!-- Footer Navigation Bar -->
          <div class="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 mt-6">
            <div class="flex items-center gap-2">
              <button 
                onclick="QuizEngine.prevQuestion()" 
                id="btnPrevQuestion"
                class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40">
                <i class="fa-solid fa-arrow-left mr-1"></i> Previous
              </button>
              <button 
                onclick="QuizEngine.clearSelection()" 
                class="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition">
                Clear
              </button>
            </div>

            <div class="flex items-center gap-2">
              <button 
                onclick="QuizEngine.toggleReview()" 
                id="btnReviewQuestion"
                class="px-4 py-2 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-xs sm:text-sm font-semibold hover:bg-purple-100 transition flex items-center gap-1.5">
                <i class="fa-regular fa-flag"></i>
                <span id="reviewBtnLabel">Mark for Review</span>
              </button>
              <button 
                onclick="QuizEngine.nextQuestion()" 
                id="btnNextQuestion"
                class="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-1.5">
                <span>Save & Next</span>
                <i class="fa-solid fa-arrow-right ml-1"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Sidebar: Question Palette -->
        <aside class="w-full md:w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between flex-shrink-0 max-h-[380px] md:max-h-full overflow-y-auto">
          <div>
            <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 class="text-xs sm:text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Question Palette
              </h3>
              <span class="text-xs text-slate-500 dark:text-slate-400 font-mono" id="paletteAnsweredCount">0/${this.questions.length} Answered</span>
            </div>

            <!-- Legend -->
            <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Answered
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Visited
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-purple-500 inline-block"></span> Review
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 inline-block"></span> Unvisited
              </div>
            </div>

            <!-- Grid Numbers -->
            <div id="quizPaletteGrid" class="grid grid-cols-5 sm:grid-cols-5 gap-2">
              <!-- Injected dynamically -->
            </div>
          </div>
        </aside>

      </div>
    `;
  },

  /**
   * Render Active Question Content
   */
  renderCurrentQuestion() {
    const q = this.questions[this.currentIndex];
    if (!q) return;

    this.visitedList.add(q.id);

    const body = document.getElementById('quizQuestionBody');
    if (!body) return;

    const selectedOption = this.userAnswers[q.id];
    const isMarkedReview = this.reviewList.has(q.id);

    body.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono">
            Question ${this.currentIndex + 1} of ${this.questions.length}
          </span>
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">
            ${q.subject}
          </span>
        </div>
        <span class="text-xs text-slate-400 font-mono">+1.0 / -0.25</span>
      </div>

      <!-- Question Text (Bilingual) -->
      <div class="space-y-2">
        <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
          ${q.question}
        </h3>
        ${q.question_hi ? `
          <p class="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-hindi leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            ${q.question_hi}
          </p>
        ` : ''}
      </div>

      <!-- Options -->
      <div class="space-y-3 pt-2">
        ${q.options.map((opt, optIdx) => {
          const isSelected = selectedOption === optIdx;
          return `
            <button 
              onclick="QuizEngine.selectAnswer(${optIdx})"
              class="w-full text-left p-3.5 sm:p-4 rounded-xl border transition flex items-center justify-between text-xs sm:text-sm font-medium ${
                isSelected 
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20' 
                  : 'border-slate-200 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
              }">
              <div class="flex items-center gap-3">
                <span class="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}">
                  ${String.fromCharCode(65 + optIdx)}
                </span>
                <span>${opt}</span>
              </div>
              <i class="${isSelected ? 'fa-solid fa-circle-check text-emerald-600 dark:text-emerald-400' : 'fa-regular fa-circle text-slate-300 dark:text-slate-600'} text-base"></i>
            </button>
          `;
        }).join('')}
      </div>
    `;

    // Update Nav Buttons
    const btnPrev = document.getElementById('btnPrevQuestion');
    if (btnPrev) btnPrev.disabled = this.currentIndex === 0;

    const btnNext = document.getElementById('btnNextQuestion');
    if (btnNext) {
      btnNext.innerHTML = this.currentIndex === this.questions.length - 1 
        ? `<span>Save & Finish</span> <i class="fa-solid fa-check ml-1"></i>`
        : `<span>Save & Next</span> <i class="fa-solid fa-arrow-right ml-1"></i>`;
    }

    const reviewLabel = document.getElementById('reviewBtnLabel');
    if (reviewLabel) {
      reviewLabel.innerText = isMarkedReview ? 'Remove Review' : 'Mark for Review';
    }

    this.updatePalette();
  },

  /**
   * User selects an option
   */
  selectAnswer(optIdx) {
    const q = this.questions[this.currentIndex];
    this.userAnswers[q.id] = optIdx;
    this.renderCurrentQuestion();
  },

  /**
   * Clear current selection
   */
  clearSelection() {
    const q = this.questions[this.currentIndex];
    delete this.userAnswers[q.id];
    this.renderCurrentQuestion();
  },

  /**
   * Toggle Mark for Review
   */
  toggleReview() {
    const q = this.questions[this.currentIndex];
    if (this.reviewList.has(q.id)) {
      this.reviewList.delete(q.id);
    } else {
      this.reviewList.add(q.id);
    }
    this.renderCurrentQuestion();
  },

  /**
   * Next Question
   */
  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.renderCurrentQuestion();
    } else {
      this.confirmSubmit();
    }
  },

  /**
   * Previous Question
   */
  prevQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderCurrentQuestion();
    }
  },

  /**
   * Jump to specific question via palette
   */
  jumpToQuestion(index) {
    if (index >= 0 && index < this.questions.length) {
      this.currentIndex = index;
      this.renderCurrentQuestion();
    }
  },

  /**
   * Update Palette Grid UI
   */
  updatePalette() {
    const grid = document.getElementById('quizPaletteGrid');
    const countElem = document.getElementById('paletteAnsweredCount');
    if (!grid) return;

    let answeredCount = 0;

    grid.innerHTML = this.questions.map((q, idx) => {
      const isCurrent = idx === this.currentIndex;
      const isAnswered = this.userAnswers[q.id] !== undefined;
      const isReview = this.reviewList.has(q.id);
      const isVisited = this.visitedList.has(q.id);

      if (isAnswered) answeredCount++;

      let bgClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'; // Unvisited

      if (isReview) {
        bgClass = 'bg-purple-600 text-white border-purple-600';
      } else if (isAnswered) {
        bgClass = 'bg-emerald-600 text-white border-emerald-600 shadow-sm';
      } else if (isVisited) {
        bgClass = 'bg-red-500 text-white border-red-500';
      }

      const ringClass = isCurrent ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 font-extrabold scale-105' : '';

      return `
        <button 
          onclick="QuizEngine.jumpToQuestion(${idx})"
          class="w-10 h-10 rounded-xl text-xs font-semibold flex items-center justify-center transition border ${bgClass} ${ringClass}">
          ${idx + 1}
        </button>
      `;
    }).join('');

    if (countElem) {
      countElem.innerText = `${answeredCount}/${this.questions.length} Answered`;
    }
  },

  /**
   * User confirmation before submit
   */
  confirmSubmit() {
    const answeredCount = Object.keys(this.userAnswers).length;
    const unansweredCount = this.questions.length - answeredCount;

    const ok = confirm(`Do you really want to submit the Mock Test?\n\n• Answered: ${answeredCount}\n• Unanswered: ${unansweredCount}\n• Total Time Left: ${document.getElementById('quizTimerDisplay')?.innerText || ''}`);
    if (ok) {
      this.submitTest(false);
    }
  },

  /**
   * Calculate Results & Render Scorecard
   */
  submitTest(isAuto = false) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.isTestActive = false;

    const timeSpentSeconds = this.totalTimeSeconds - this.remainingSeconds;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const subjectStats = {};

    this.questions.forEach(q => {
      const subj = q.subject || 'General';
      if (!subjectStats[subj]) subjectStats[subj] = { total: 0, correct: 0, incorrect: 0 };
      subjectStats[subj].total++;

      const selected = this.userAnswers[q.id];
      if (selected === undefined) {
        unattemptedCount++;
      } else if (selected === q.correct_index) {
        correctCount++;
        subjectStats[subj].correct++;
      } else {
        incorrectCount++;
        subjectStats[subj].incorrect++;
      }
    });

    const rawScore = (correctCount * this.marking.correct) - (incorrectCount * this.marking.negative);
    const finalScore = Math.max(0, rawScore).toFixed(2);
    const maxScore = this.questions.length * this.marking.correct;
    const accuracy = correctCount + incorrectCount > 0 
      ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) 
      : 0;

    // Render Scorecard Modal
    this.renderScorecard({
      isAuto,
      timeSpentSeconds,
      correctCount,
      incorrectCount,
      unattemptedCount,
      finalScore,
      maxScore,
      accuracy,
      subjectStats
    });
  },

  /**
   * Render Scorecard Dashboard
   */
  renderScorecard(results) {
    const arena = document.getElementById('quizTestArenaModal');
    if (!arena) return;

    const mins = Math.floor(results.timeSpentSeconds / 60);
    const secs = results.timeSpentSeconds % 60;
    const timeFormatted = `${mins}m ${secs}s`;

    let performanceBadge = {
      title: 'उत्कृष्ट प्रदर्शन (Excellent!)',
      color: 'from-emerald-500 to-teal-600',
      icon: 'fa-trophy'
    };
    if (results.accuracy < 50) {
      performanceBadge = {
        title: 'अभ्यास की आवश्यकता (Needs Practice)',
        color: 'from-amber-500 to-orange-600',
        icon: 'fa-book-open'
      };
    } else if (results.accuracy < 75) {
      performanceBadge = {
        title: 'अच्छा प्रयास (Good Effort!)',
        color: 'from-blue-500 to-indigo-600',
        icon: 'fa-medal'
      };
    }

    arena.innerHTML = `
      <div class="max-w-4xl w-full mx-auto my-auto p-4 sm:p-6 overflow-y-auto max-h-[95vh]">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
          
          <!-- Banner -->
          <div class="text-center space-y-2">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${performanceBadge.color} text-white text-xs font-bold shadow-md">
              <i class="fa-solid ${performanceBadge.icon}"></i> ${performanceBadge.title}
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Mock Test Result Scorecard
            </h2>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              UKPSC/UKSSC Marking Scheme: +1.0 for Correct | -0.25 for Incorrect
            </p>
          </div>

          <!-- Score Highlight Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 p-4 rounded-2xl text-center">
              <span class="text-xs text-emerald-700 dark:text-emerald-300 font-semibold block">Total Score</span>
              <span class="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">${results.finalScore}</span>
              <span class="text-[11px] text-emerald-600/70 block">/ ${results.maxScore} Marks</span>
            </div>

            <div class="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 p-4 rounded-2xl text-center">
              <span class="text-xs text-blue-700 dark:text-blue-300 font-semibold block">Accuracy</span>
              <span class="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">${results.accuracy}%</span>
              <span class="text-[11px] text-blue-600/70 block">${results.correctCount}/${results.correctCount + results.incorrectCount} Attempted</span>
            </div>

            <div class="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/40 p-4 rounded-2xl text-center">
              <span class="text-xs text-indigo-700 dark:text-indigo-300 font-semibold block">Time Spent</span>
              <span class="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">${timeFormatted}</span>
              <span class="text-[11px] text-indigo-600/70 block">Allocated: 15m</span>
            </div>

            <div class="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-center">
              <span class="text-xs text-slate-600 dark:text-slate-400 font-semibold block">Questions Summary</span>
              <div class="flex items-center justify-center gap-2 mt-2 text-xs font-bold font-mono">
                <span class="text-emerald-600" title="Correct">✓${results.correctCount}</span>
                <span class="text-red-500" title="Wrong">✗${results.incorrectCount}</span>
                <span class="text-slate-400" title="Skipped">⚪${results.unattemptedCount}</span>
              </div>
            </div>
          </div>

          <!-- Subject-wise Breakdown -->
          <div class="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Subject-wise Performance Breakdown
            </h4>
            <div class="space-y-2.5">
              ${Object.entries(results.subjectStats).map(([subj, data]) => {
                const subAcc = data.correct + data.incorrect > 0 
                  ? Math.round((data.correct / data.total) * 100) 
                  : 0;
                return `
                  <div class="space-y-1">
                    <div class="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                      <span>${subj} (${data.total} Qs)</span>
                      <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">${data.correct} Correct | ${subAcc}%</span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div class="h-full bg-emerald-500 rounded-full" style="width: ${subAcc}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              onclick="QuizEngine.renderDetailedReview()" 
              class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold flex items-center gap-2">
              <i class="fa-solid fa-list-check"></i>
              <span>Review All Questions & Explanations</span>
            </button>

            <div class="flex items-center gap-2">
              <button 
                onclick="QuizEngine.startTest(allQuestions, 15)" 
                class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md flex items-center gap-2">
                <i class="fa-solid fa-rotate-right"></i>
                <span>Retake Test</span>
              </button>
              <button 
                onclick="QuizEngine.closeArena()" 
                class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">
                Close to Home
              </button>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  /**
   * Render Question-by-Question Solution Review
   */
  renderDetailedReview() {
    const arena = document.getElementById('quizTestArenaModal');
    if (!arena) return;

    arena.innerHTML = `
      <div class="max-w-4xl w-full mx-auto my-auto p-4 sm:p-6 overflow-y-auto max-h-[95vh]">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
          
          <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white">Detailed Solutions & Answer Key</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Complete bilingual explanations for all questions</p>
            </div>
            <button 
              onclick="QuizEngine.closeArena()" 
              class="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200">
              <i class="fa-solid fa-xmark text-base"></i>
            </button>
          </div>

          <div class="space-y-6">
            ${this.questions.map((q, idx) => {
              const userAns = this.userAnswers[q.id];
              const isCorrect = userAns === q.correct_index;
              const isSkipped = userAns === undefined;

              let statusBadge = `<span class="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">✓ Correct (+1.0)</span>`;
              if (isSkipped) {
                statusBadge = `<span class="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">⚪ Skipped (0.0)</span>`;
              } else if (!isCorrect) {
                statusBadge = `<span class="px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">✗ Incorrect (-0.25)</span>`;
              }

              return `
                <div class="p-5 rounded-2xl border ${isCorrect ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20' : isSkipped ? 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20' : 'border-red-200 dark:border-red-900/60 bg-red-50/20'} space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold font-mono text-slate-500">Q${idx + 1}. [${q.subject}]</span>
                    ${statusBadge}
                  </div>

                  <h4 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                    ${q.question}
                  </h4>
                  ${q.question_hi ? `<p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-hindi">${q.question_hi}</p>` : ''}

                  <!-- Options List -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs sm:text-sm">
                    ${q.options.map((opt, optIdx) => {
                      const isCorrectOpt = optIdx === q.correct_index;
                      const isUserSelected = userAns === optIdx;

                      let optClass = 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300';
                      if (isCorrectOpt) {
                        optClass = 'border-emerald-500 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold';
                      } else if (isUserSelected && !isCorrectOpt) {
                        optClass = 'border-red-400 bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-200';
                      }

                      return `
                        <div class="p-3 rounded-xl border ${optClass} flex items-center justify-between">
                          <span><b class="mr-1 font-mono">${String.fromCharCode(65 + optIdx)}.</b> ${opt}</span>
                          ${isCorrectOpt ? '<i class="fa-solid fa-check text-emerald-600"></i>' : (isUserSelected ? '<i class="fa-solid fa-xmark text-red-500"></i>' : '')}
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <!-- Explanation Box -->
                  <div class="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm space-y-1.5 mt-2">
                    <div class="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <i class="fa-solid fa-circle-info"></i> Explanation / व्याख्या:
                    </div>
                    <p class="text-slate-700 dark:text-slate-300 leading-relaxed">${q.explanation}</p>
                    ${q.explanation_hi ? `<p class="text-slate-600 dark:text-slate-400 font-hindi border-t border-slate-100 dark:border-slate-700 pt-1.5">${q.explanation_hi}</p>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="text-center pt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              onclick="QuizEngine.closeArena()" 
              class="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 text-white font-bold text-xs sm:text-sm">
              Done / Return to Home
            </button>
          </div>

        </div>
      </div>
    `;
  },

  /**
   * Close Test Arena and return to Home
   */
  closeArena() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const arena = document.getElementById('quizTestArenaModal');
    if (arena) arena.remove();
  }
};

window.QuizEngine = QuizEngine;
