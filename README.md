# EduGrade AI - Smart Subjective AutoGrader

**EduGrade AI** is a premium, modern, and highly visual web-based educational tool designed to assist teachers and professors in automatically evaluating descriptive (subjective) exam answers. Using client-side generative AI (Google Gemini 1.5 Flash) combined with local Natural Language Processing (NLP) token-similarity heuristics, it predicts marks, assigns letter grades, identifies missing key terms, and generates rich, constructive, human-like feedback.


This project is structured as a fully functional, self-contained **Single Page Application (SPA)** that runs entirely in the browser. It features a premium, responsive glassmorphic interface, beautiful interactive dashboard charts, custom print-ready assessment reports, and support for both light and dark themes.

---

## 🌟 Key Features

1. **Dual Grading Engine**:
   - **Gemini AI Mode**: Integrates directly with Google Gemini 1.5 Flash to evaluate logical flow, correct definitions, context, and semantic correctness.
   - **Local Heuristics Mode (Fallback)**: Uses local NLP string tokenization, keyword overlap analysis, length metrics, and structural comparison if no API key is configured.
2. **Rich Performance Insights**:
   - Scores resolved to the nearest 0.5 marks.
   - Standard academic letter grades (A+, A, B+, B, C+, C, D, F).
   - Natural language teacher feedback summarizing strengths, omissions, and actionable recommendations.
   - AI confidence percentage gauge indicator.
3. **Analytics Dashboard**:
   - Real-time KPI summaries (Total graded, Average score %, Avg confidence, Active subject courses).
   - Grade distribution frequency bar chart (Chart.js).
   - Chronological performance scores trend line graph.
   - Subject-wise average performance comparison.
   - Local database log list with view and delete capabilities.
4. **Custom Assessment Certificate**:
   - Glassmorphic card styling with an animated SVG score progress circle.
   - Dedicated buttons to copy formatted feedback text or download the report instantly as an A4 PDF sheet (using `html2pdf.js`).
5. **Additional Utilities**:
   - Real-time student answer word counter, character counter, and estimated reading time indicator.
   - Answer quality coverage progress bar ("Local Content Richness").
   - Dark Mode / Light Mode toggle.
   - Mobile sidebar toggle with fully responsive CSS rules.

---

## 🛠️ Technology Stack & Libraries

To ensure ease of deployment and zero environment friction, this application uses standard modern web technologies:

* **Core Structure**: HTML5 semantic markup.
* **Styling & Layout**: Vanilla CSS3 Custom Variables (CSS grid, flexbox, glassmorphic filters, keyframes, transitions). No external CSS dependencies or compiler build-steps are needed.
* **Logic**: Vanilla ES6 JavaScript Modules.
* **Visual Icons**: [Lucide Icons](https://lucide.dev/) (loaded asynchronously from unpkg CDN).
* **Analytics Charts**: [Chart.js](https://www.chartjs.org/) (loaded via jsDelivr CDN).
* **PDF Exporter**: [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) (loaded via cdnjs).

---

## 🚀 How to Run the Project

Since this is a client-side SPA with no Node.js or Python backend server requirements, you can run it immediately using one of the two methods below:

### Method 1: Instant Launch (Recommended for Quick Demos)
1. Navigate to the project root directory: `smart-ai-autograder-premium/`.
2. Double-click the `index.html` file to open it directly in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).

### Method 2: Serve Locally (Optional)
If you prefer running it via a local loopback server, run any of the following command lines in your terminal:

**Using Python:**
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser.

---

## 🔑 AI Configuration (Live Gemini AI)

By default, the application runs in **Local Heuristics Mode** with offline calculators. To enable live, dynamic, context-aware AI grading:

1. Click on the **Gemini API Key** button in the sidebar footer.
2. Enter a valid Google Gemini API Key.
   * *To get a free key, log into the [Google AI Studio](https://aistudio.google.com/) portal with a Google account, and click **"Get API Key"**.*
3. Click **"Save API Key"**.
4. The status badge will change to **Gemini AI Active** (green). Your key is stored strictly inside your browser's local storage and is never uploaded anywhere except to Google's official Gemini endpoint.

---

## 📐 Grading Heuristics (Local Fallback Model)

When operating offline, the application executes a mathematical model to assess subjective responses:

1. **Pre-processing**: Removes common English stop words (`the`, `and`, `is`, etc.) and filters out punctuation to extract core nouns, verbs, and domain-specific terms.
2. **Semantic Overlap**: Computes a ratio of intersection between keywords in the student's answer and the model answer (benchmark).
3. **Length Analysis**: Evaluates the ratio of words written compared to the model answer, penalizing short answers and rewarding descriptive answers up to 1.3x benchmark length.
4. **Calculations**:
   - `Final Ratio = (Keyword Overlap * 0.65) + (Length Ratio * 0.35)`
   - `Score = Math.Round(Final Ratio * Max Marks * 2) / 2`
   - Confidence levels and feedbacks are then selected from range structures based on this score percentage.

---

## 📂 Project Structure

```
smart-ai-autograder-premium/
│
├── index.html       # Single Page Application main entry
├── styles.css       # Core design system stylesheet & variables
│
└── js/              # Modular application scripts
    ├── app.js       # App configuration, state, localStorage, routing, theme
    ├── grader.js    # Inputs handlers, text analysis, local fallback, Gemini API caller
    ├── dashboard.js # Chart.js controllers, stats calculations, database logs table
    └── report.js    # PDF download, copy to clipboard, and report renderer
```

---

## 🤝 Project Customization

To personalize the project for your evaluation or university defense, open `index.html` and search for `<section id="page-developer" class="page-section">`. You can customize the developer name, profile bio, university credentials, or links to matching social profiles directly in the HTML.
