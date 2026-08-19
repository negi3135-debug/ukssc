/**
 * UK Exam Hub - Core Application Logic
 * State management, search filters, bookmarks, and bulk question uploader.
 */

const App = {
  questions: [],
  filteredQuestions: [],
  bookmarks: JSON.parse(localStorage.getItem('uk_exam_bookmarks') || '[]'),
  customUploadedQuestions: JSON.parse(localStorage.getItem('uk_custom_questions') || '[]'),
  filter: {
    exam: 'ALL',
    subject: 'ALL',
    search: '',
    onlyBookmarks: false
  },

  async init() {
    this.initTheme();
    this.updateBookmarkBadge();
    await this.loadAllQuestions();
    this.setupEventListeners();
  },

  async loadAllQuestions() {
    try {
      const res = await fetch('data/questions.json');
      if (!res.ok) throw new Error('Fetch failed');
      const baseQuestions = await res.json();
      this.questions = [...baseQuestions, ...this.customUploadedQuestions];
    } catch (err) {
      console.warn('Using embedded dataset with custom questions fallback.', err);
      if (window.EMBEDDED_QUESTIONS) {
        this.questions = [...window.EMBEDDED_QUESTIONS, ...this.customUploadedQuestions];
      }
    }
    window.allQuestions = this.questions;
    this.renderDailyChallenge();
    this.render();
  },

  renderDailyChallenge() {
    const container = document.getElementById('dailyQuestionCardBody');
    const dateText = document.getElementById('dailyChallengeDateText');
    const timerElem = document.getElementById('dailyNextResetTimer');
    if (!container || this.questions.length === 0) return;

    // Deterministic question index based on Date
    const today = new Date();
    const dateStr = today.toDateString();
    if (dateText) {
      dateText.innerText = `📅 ${today.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }

    // Countdown to next midnight
    const tomorrow = new Date(today);
    tomorrow.setHours(24, 0, 0, 0);
    const diffMs = tomorrow - today;
    const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
    const minsLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (timerElem) {
      timerElem.innerText = `अगला प्रश्न: ${hoursLeft}h ${minsLeft}m में`;
    }

    const dayHash = (today.getFullYear() * 365 + today.getMonth() * 31 + today.getDate());
    const dailyIndex = dayHash % this.questions.length;
    const q = this.questions[dailyIndex];

    const isAnsweredKey = `uk_daily_answered_${dateStr}`;
    const savedDailyAnswer = localStorage.getItem(isAnsweredKey);

    container.innerHTML = `
      <div class="space-y-4">
        <!-- Question Badge & Subject -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xs font-black px-2.5 py-0.5 rounded-lg bg-amber-500 text-slate-950">
              ${q.exam} ${q.year || ''}
            </span>
            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">
              📌 ${q.subject} • ${q.topic}
            </span>
          </div>
          <span class="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-bold">1 Daily Practice</span>
        </div>

        <!-- Question Text -->
        <div class="space-y-1">
          <h3 class="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
            ${q.question}
          </h3>
          ${q.question_hi ? `<p class="text-sm text-slate-600 dark:text-slate-300 font-hindi font-medium leading-relaxed">${q.question_hi}</p>` : ''}
        </div>

        <!-- Options Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1" id="dailyOptionsGrid">
          ${q.options.map((opt, optIdx) => {
            return `
              <button 
                onclick="App.selectDailyOption(${optIdx}, ${q.correct_index}, '${dateStr}', '${q.id}')"
                id="daily-opt-${optIdx}"
                class="daily-opt-btn text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-between text-slate-800 dark:text-slate-200 transition">
                <span><b class="mr-2 font-mono text-amber-500">${String.fromCharCode(65 + optIdx)}.</b>${opt}</span>
                <i class="fa-regular fa-circle text-xs text-slate-300 dark:text-slate-600" id="daily-icon-${optIdx}"></i>
              </button>
            `;
          }).join('')}
        </div>

        <!-- Explanation Revealed -->
        <div id="dailyExpBox" class="${savedDailyAnswer !== null ? '' : 'hidden'} mt-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-900 text-xs sm:text-sm space-y-2">
          <div class="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <i class="fa-solid fa-circle-check text-emerald-600"></i> सही उत्तर: Option (${String.fromCharCode(65 + q.correct_index)}) - ${q.options[q.correct_index]}
          </div>
          <p class="text-slate-700 dark:text-slate-300 leading-relaxed">${q.explanation}</p>
          ${q.explanation_hi ? `<p class="text-slate-600 dark:text-slate-400 font-hindi border-t border-emerald-200 dark:border-emerald-900 pt-1.5">${q.explanation_hi}</p>` : ''}
        </div>
      </div>
    `;

    if (savedDailyAnswer !== null) {
      this.revealDailyAnswerUI(parseInt(savedDailyAnswer), q.correct_index);
    }
  },

  selectDailyOption(selectedIdx, correctIdx, dateStr, qId) {
    localStorage.setItem(`uk_daily_answered_${dateStr}`, selectedIdx);
    this.revealDailyAnswerUI(selectedIdx, correctIdx);
  },

  revealDailyAnswerUI(selectedIdx, correctIdx) {
    for (let i = 0; i < 4; i++) {
      const btn = document.getElementById(`daily-opt-${i}`);
      const icon = document.getElementById(`daily-icon-${i}`);
      if (!btn) continue;
      btn.disabled = true;
      btn.className = 'text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold flex items-center justify-between text-slate-600 dark:text-slate-400 opacity-80';
      if (icon) icon.className = 'fa-regular fa-circle text-xs text-slate-300 dark:text-slate-600';
    }

    const selectedBtn = document.getElementById(`daily-opt-${selectedIdx}`);
    const selectedIcon = document.getElementById(`daily-icon-${selectedIdx}`);
    const correctBtn = document.getElementById(`daily-opt-${correctIdx}`);
    const correctIcon = document.getElementById(`daily-icon-${correctIdx}`);

    if (correctBtn) {
      correctBtn.className = 'text-left p-3.5 rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold flex items-center justify-between';
      if (correctIcon) correctIcon.className = 'fa-solid fa-circle-check text-emerald-600 text-sm';
    }

    if (selectedIdx !== correctIdx && selectedBtn) {
      selectedBtn.className = 'text-left p-3.5 rounded-xl border-2 border-red-400 bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 text-xs sm:text-sm font-bold flex items-center justify-between';
      if (selectedIcon) selectedIcon.className = 'fa-solid fa-circle-xmark text-red-500 text-sm';
    }

    const expBox = document.getElementById('dailyExpBox');
    if (expBox) expBox.classList.remove('hidden');
  },

  setupEventListeners() {
    // Keyboard shortcut '/' to search
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        const searchInput = document.getElementById('globalSearchInput');
        if (searchInput) searchInput.focus();
      }
    });
  },

  render() {
    const container = document.getElementById('questionsContainer');
    if (!container) return;

    this.filteredQuestions = this.questions.filter(q => {
      const matchExam = this.filter.exam === 'ALL' || q.exam === this.filter.exam;
      const matchSubject = this.filter.subject === 'ALL' || q.subject === this.filter.subject;
      const matchBookmark = !this.filter.onlyBookmarks || this.bookmarks.includes(q.id);
      
      const qText = (q.question || '').toLowerCase();
      const qTextHi = (q.question_hi || '').toLowerCase();
      const qSubj = (q.subject || '').toLowerCase();
      const qTopic = (q.topic || '').toLowerCase();
      const search = this.filter.search.toLowerCase();

      const matchSearch = !search || 
        qText.includes(search) || 
        qTextHi.includes(search) || 
        qSubj.includes(search) || 
        qTopic.includes(search);

      return matchExam && matchSubject && matchBookmark && matchSearch;
    });

    const countElem = document.getElementById('resultsCount');
    if (countElem) {
      countElem.innerText = `Showing ${this.filteredQuestions.length} of ${this.questions.length} questions`;
    }

    if (this.filteredQuestions.length === 0) {
      container.innerHTML = `
        <div class="glass-card rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400 space-y-3">
          <i class="fa-solid fa-magnifying-glass text-4xl opacity-30 text-emerald-500"></i>
          <h4 class="text-base font-bold text-slate-800 dark:text-white">No questions found matching your criteria</h4>
          <p class="text-xs">Try searching another keyword (e.g. Chand, Gorkha, Ganga, Monal) or clear filters.</p>
          <button onclick="App.resetFilters()" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm">
            Reset Filters
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.filteredQuestions.map((q, idx) => {
      const isBookmarked = this.bookmarks.includes(q.id);
      const examBadgeClass = q.exam === 'UKPSC' 
        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' 
        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300';

      return `
        <article class="glass-card rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:shadow-md border border-slate-200/80 dark:border-slate-800" id="card-${q.id}">
          
          <!-- Card Header: Badges & Bookmark -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-md ${examBadgeClass}">
                ${q.exam} ${q.year || ''}
              </span>
              <span class="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                ${q.subject}
              </span>
              <span class="text-[10px] text-slate-400 hidden sm:inline-block">
                • ${q.topic}
              </span>
            </div>

            <!-- Bookmark Button -->
            <button 
              onclick="App.toggleBookmark('${q.id}')" 
              title="${isBookmarked ? 'Remove Bookmark' : 'Save Question'}"
              class="p-1.5 text-slate-400 hover:text-amber-500 transition ${isBookmarked ? 'text-amber-500' : ''}">
              <i class="${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark text-base"></i>
            </button>
          </div>

          <!-- Question Text (Bilingual) -->
          <div class="space-y-1.5 mb-4">
            <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
              <span class="text-emerald-600 dark:text-emerald-400 font-mono mr-1">Q${idx + 1}.</span> ${q.question}
            </h3>
            ${q.question_hi ? `<p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-hindi leading-relaxed">${q.question_hi}</p>` : ''}
          </div>

          <!-- Options Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
            ${q.options.map((opt, optIdx) => `
              <button 
                onclick="App.selectOption('${q.id}', ${optIdx}, ${q.correct_index})"
                id="opt-${q.id}-${optIdx}"
                class="option-btn text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-medium flex items-center justify-between gap-2 text-slate-700 dark:text-slate-200">
                <span><b class="mr-2 font-mono text-slate-400">${String.fromCharCode(65 + optIdx)}.</b>${opt}</span>
                <i class="fa-regular fa-circle text-xs text-slate-300 dark:text-slate-600" id="icon-${q.id}-${optIdx}"></i>
              </button>
            `).join('')}
          </div>

          <!-- Actions: Show Answer & Explanation Button -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <button 
              onclick="App.toggleExplanation('${q.id}')"
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 py-1">
              <i class="fa-solid fa-lightbulb"></i>
              <span id="exp-btn-text-${q.id}">Show Answer & Explanation</span>
              <i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200" id="exp-arrow-${q.id}"></i>
            </button>

            <span class="text-[11px] text-slate-400 font-mono">ID: ${q.id}</span>
          </div>

          <!-- Collapsible Explanation Accordion -->
          <div id="exp-box-${q.id}" class="hidden mt-3 p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-xs sm:text-sm space-y-2">
            <div class="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <i class="fa-solid fa-circle-check text-emerald-600"></i> Correct Answer: Option (${String.fromCharCode(65 + q.correct_index)}) - ${q.options[q.correct_index]}
            </div>
            <p class="text-slate-700 dark:text-slate-300 leading-relaxed">${q.explanation}</p>
            ${q.explanation_hi ? `<p class="text-slate-600 dark:text-slate-400 font-hindi border-t border-emerald-200/40 dark:border-emerald-900/30 pt-1.5">${q.explanation_hi}</p>` : ''}
          </div>

        </article>
      `;
    }).join('');
  },

  selectOption(qId, selectedIdx, correctIdx) {
    for (let i = 0; i < 4; i++) {
      const btn = document.getElementById(`opt-${qId}-${i}`);
      const icon = document.getElementById(`icon-${qId}-${i}`);
      if (!btn) continue;
      btn.classList.remove('selected', 'correct-reveal', 'wrong-reveal');
      icon.className = 'fa-regular fa-circle text-xs text-slate-300 dark:text-slate-600';
    }

    const selectedBtn = document.getElementById(`opt-${qId}-${selectedIdx}`);
    const selectedIcon = document.getElementById(`icon-${qId}-${selectedIdx}`);

    if (selectedIdx === correctIdx) {
      selectedBtn.classList.add('correct-reveal');
      selectedIcon.className = 'fa-solid fa-circle-check text-emerald-600 dark:text-emerald-400';
    } else {
      selectedBtn.classList.add('wrong-reveal');
      selectedIcon.className = 'fa-solid fa-circle-xmark text-red-500';

      const correctBtn = document.getElementById(`opt-${qId}-${correctIdx}`);
      const correctIcon = document.getElementById(`icon-${qId}-${correctIdx}`);
      if (correctBtn) {
        correctBtn.classList.add('correct-reveal');
        correctIcon.className = 'fa-solid fa-circle-check text-emerald-600';
      }
    }
  },

  toggleExplanation(qId) {
    const box = document.getElementById(`exp-box-${qId}`);
    const arrow = document.getElementById(`exp-arrow-${qId}`);
    const btnText = document.getElementById(`exp-btn-text-${qId}`);

    if (box.classList.contains('hidden')) {
      box.classList.remove('hidden');
      arrow.classList.add('rotate-180');
      btnText.innerText = 'Hide Explanation';
    } else {
      box.classList.add('hidden');
      arrow.classList.remove('rotate-180');
      btnText.innerText = 'Show Answer & Explanation';
    }
  },

  setExamFilter(exam) {
    this.filter.exam = exam;
    ['ALL', 'UKPSC', 'UKSSC'].forEach(e => {
      const pill = document.getElementById(`exam-pill-${e}`);
      if (pill) {
        if (e === exam) {
          pill.className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm';
        } else {
          pill.className = 'px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white';
        }
      }
    });
    this.render();
  },

  setSubjectFilter(subj) {
    this.filter.subject = subj;
    const chips = document.querySelectorAll('.subject-chip');
    chips.forEach(chip => {
      if (chip.innerText.includes(subj === 'ALL' ? 'All Subjects' : subj)) {
        chip.className = 'subject-chip whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium bg-emerald-600 text-white shadow-sm transition';
      } else {
        chip.className = 'subject-chip whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition';
      }
    });
    this.render();
  },

  handleSearch(val) {
    this.filter.search = val.trim();
    this.render();
  },

  resetFilters() {
    this.filter = { exam: 'ALL', subject: 'ALL', search: '', onlyBookmarks: false };
    const searchInputs = document.querySelectorAll('input[type="text"]');
    searchInputs.forEach(i => i.value = '');
    this.setExamFilter('ALL');
    this.setSubjectFilter('ALL');
    this.updateBookmarkUI();
    this.render();
  },

  toggleBookmark(qId) {
    if (this.bookmarks.includes(qId)) {
      this.bookmarks = this.bookmarks.filter(id => id !== qId);
    } else {
      this.bookmarks.push(qId);
    }
    localStorage.setItem('uk_exam_bookmarks', JSON.stringify(this.bookmarks));
    this.updateBookmarkBadge();
    this.render();
  },

  toggleBookmarkFilter() {
    this.filter.onlyBookmarks = !this.filter.onlyBookmarks;
    this.updateBookmarkUI();
    this.render();
  },

  updateBookmarkUI() {
    const btn = document.getElementById('bookmarkToggleBtn');
    if (!btn) return;
    if (this.filter.onlyBookmarks) {
      btn.classList.add('bg-amber-100', 'text-amber-600', 'dark:bg-amber-950', 'dark:text-amber-300');
    } else {
      btn.classList.remove('bg-amber-100', 'text-amber-600', 'dark:bg-amber-950', 'dark:text-amber-300');
    }
  },

  updateBookmarkBadge() {
    const badge = document.getElementById('bookmarkBadgeCount');
    if (!badge) return;
    if (this.bookmarks.length > 0) {
      badge.innerText = this.bookmarks.length;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },

  initTheme() {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  toggleDarkMode() {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    }
  },

  // Bulk Upload Tools (CSV / JSON)
  openUploaderModal() {
    document.getElementById('bulkUploaderModal').classList.remove('hidden');
  },

  closeUploaderModal() {
    document.getElementById('bulkUploaderModal').classList.add('hidden');
  },

  processCSVUpload(csvText) {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) throw new Error('CSV must have header row and at least 1 data row.');
      
      const newQuestions = [];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (row.length >= 7) {
          // Format: id, exam, year, subject, topic, question, opt_a, opt_b, opt_c, opt_d, correct_idx, explanation
          newQuestions.push({
            id: row[0] || `uk-custom-${Date.now()}-${i}`,
            exam: row[1] || 'UKPSC',
            year: parseInt(row[2]) || 2024,
            subject: row[3] || 'Uttarakhand GK',
            topic: row[4] || 'General',
            question: row[5],
            options: [row[6], row[7], row[8], row[9]],
            correct_index: parseInt(row[10]) || 0,
            explanation: row[11] || 'Added via bulk upload.'
          });
        }
      }

      this.customUploadedQuestions = [...this.customUploadedQuestions, ...newQuestions];
      localStorage.setItem('uk_custom_questions', JSON.stringify(this.customUploadedQuestions));
      this.questions = [...this.questions, ...newQuestions];
      window.allQuestions = this.questions;
      
      alert(`Success! Successfully uploaded and saved ${newQuestions.length} questions.`);
      this.closeUploaderModal();
      this.render();
    } catch (err) {
      alert('Error parsing CSV: ' + err.message);
    }
  },

  startMockTest(duration = 15) {
    if (window.QuizEngine) {
      window.QuizEngine.startTest(this.questions, duration);
    }
  }
};

window.App = App;
