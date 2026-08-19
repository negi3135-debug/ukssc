# 🏔️ UK Exam Hub (देवभूमि परीक्षा मंच)

A lightweight, blazing-fast, mobile-friendly, and SEO-optimized **MCQ Practice & Study Material Web Application** designed specifically for **UKPSC** (Upper PCS, Lower PCS, RO/ARO, Executive Officer) and **UKSSC** (VDO, VPDO, Forest Guard, Patwari, Police SI) competitive exams.

---

## ⚡ Key Features

- **🎯 Interactive Timed Mock Test Engine (`js/quizEngine.js`)**:
  - 10, 15, or 30-minute customizable countdown timer with urgency alerts.
  - Interactive **1 to N Question Palette** with color status:
    - 🟢 Green: Answered
    - 🔴 Red: Visited / Unanswered
    - 🟣 Purple: Marked for Review
    - ⚪ Grey: Unvisited
  - Automatic test submission upon timer expiration.
  - Authentic UKPSC marking scheme (**+1.0 for Correct, -0.25 negative marking for Incorrect**).
  - Instant Performance Analytics Scorecard with Subject-wise Accuracy, Time Spent, and Detailed Bilingual Solutions.

- **📚 Bilingual Question Bank & Subject Filters**:
  - Filter by Exam Board (**UKPSC / UKSSC / All**).
  - Filter by Subject (**Uttarakhand History, Geography & Rivers, State Polity & Symbols, Wildlife & Ecology, General Hindi**).
  - Instant keyword search with shortcut key `/`.
  - "Show Answer & Explanation" accordion with background facts in Hindi and English.
  - Offline Bookmark system stored in browser `localStorage`.

- **📥 In-App Bulk Question Uploader (CSV / Excel Import)**:
  - Add hundreds of new questions with 1 click via the built-in Bulk Uploader modal.
  - Sample CSV format available at `data/sample_questions.csv`.

- **🎨 Modern UI & Dark Mode**:
  - Tailwind CSS with smooth transitions and glassmorphism styling.
  - Persistent Dark / Light theme.

---

## 📁 File Structure

```
uk-exam-prep/
├── index.html                  # Main SPA entry point with bilingual UI
├── css/
│   └── styles.css              # Custom styling, typography & option states
├── js/
│   ├── app.js                  # State manager, search, bookmarks, CSV uploader
│   └── quizEngine.js           # Timed mock test simulator & scorecard generator
├── data/
│   ├── questions.json          # Primary scalable questions repository
│   └── sample_questions.csv    # Sample template for bulk Excel/CSV import
└── README.md                   # Project documentation
```

---

## 🚀 How to Run Locally

### Option 1: Direct File Open (Zero setup)
Simply double-click [`index.html`](file:///C:/Users/SAURAV%20SINGH%20NEGI/.gemini/antigravity/scratch/uk-exam-prep/index.html) in Windows File Explorer. It opens instantly in Google Chrome, Microsoft Edge, or Firefox.

### Option 2: Live Server (VS Code / Python)
```bash
# If you have Python installed:
python -m http.server 8080
```
Then visit: `http://localhost:8080`

---

## 🌐 1-Click Free Deployment (Netlify / Vercel / GitHub Pages)

This project has **zero backend dependencies and zero database costs**.

1. **Netlify Drop**:
   - Go to [https://app.netlify.com/drop](https://app.netlify.com/drop)
   - Drag & drop the `uk-exam-prep` folder.
   - Your website will be live in 10 seconds with a free `.netlify.app` domain and free SSL!

2. **GitHub Pages**:
   - Push this repo to GitHub.
   - Go to **Settings > Pages > Branch: main > Save**.
