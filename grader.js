/**
 * EduGrade AI - Smart Subjective AutoGrader
 * Grading Engine & NLP Heuristics (grader.js)
 */

window.grader = {
    init() {
        console.log("Initializing Grader Module...");
        this.setupEventListeners();
        this.setupPdfListeners();
    },

    setupEventListeners() {
        const studentAnswerTextarea = document.getElementById('student-answer');
        const modelAnswerTextarea = document.getElementById('model-answer');
        
        if (studentAnswerTextarea) {
            // Setup real-time counters
            studentAnswerTextarea.addEventListener('input', () => {
                this.updateTextStats();
            });
        }

        if (modelAnswerTextarea || studentAnswerTextarea) {
            const updateQuality = () => this.updateQualityIndicator();
            if (modelAnswerTextarea) modelAnswerTextarea.addEventListener('input', updateQuality);
            if (studentAnswerTextarea) studentAnswerTextarea.addEventListener('input', updateQuality);
        }
    },

    // Calculate word count, char count, and estimated reading time
    updateTextStats() {
        const text = document.getElementById('student-answer').value || '';
        
        // Word count
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        document.getElementById('word-count').textContent = words;
        
        // Character count
        document.getElementById('char-count').textContent = text.length;
        
        // Reading time: average adult reads at ~200 WPM
        const readTime = Math.max(1, Math.ceil(words / 200));
        document.getElementById('read-time').textContent = words === 0 ? 0 : readTime;
    },

    // Quality indicator based on length ratio and keyword overlaps
    updateQualityIndicator() {
        const studentAns = document.getElementById('student-answer').value.trim();
        const modelAns = document.getElementById('model-answer').value.trim();
        const bar = document.getElementById('quality-indicator-bar');
        const label = document.getElementById('quality-indicator-text');
        
        if (!bar || !label) return;

        if (!studentAns || !modelAns) {
            bar.style.width = '0%';
            bar.style.backgroundColor = 'var(--card-border)';
            label.textContent = 'Incomplete';
            return;
        }

        const stats = this.analyzeTextOverlap(studentAns, modelAns);
        const overlapPercent = stats.overlapRatio * 100;
        
        // Combine length ratio and overlap ratio for local quality score
        const lengthRatio = Math.min(1.2, studentAns.split(/\s+/).length / modelAns.split(/\s+/).length);
        const qualityScore = Math.min(100, Math.round((overlapPercent * 0.6) + (lengthRatio * 100 * 0.4)));

        bar.style.width = `${qualityScore}%`;

        // Color and label changes based on quality
        if (qualityScore < 30) {
            bar.style.backgroundColor = '#e74c3c'; // Red
            label.textContent = 'Weak Match';
        } else if (qualityScore < 60) {
            bar.style.backgroundColor = '#e67e22'; // Orange
            label.textContent = 'Moderate Match';
        } else if (qualityScore < 85) {
            bar.style.backgroundColor = 'var(--primary-lavender)'; // Theme primary
            label.textContent = 'Good Coverage';
        } else {
            bar.style.backgroundColor = 'var(--accent-mint)'; // Green
            label.textContent = 'Excellent Match';
        }
    },

    // Utility to parse words and find overlap
    analyzeTextOverlap(studentText, modelText) {
        const stopWords = new Set(['the', 'and', 'a', 'of', 'to', 'in', 'is', 'that', 'it', 'for', 'on', 'with', 'as', 'at', 'by', 'an', 'be', 'this', 'are', 'from', 'or', 'which', 'but', 'not', 'has', 'have', 'had', 'was', 'were', 'been', 'do', 'does', 'did', 'about', 'more', 'some', 'any']);
        
        const getKeywords = (text) => {
            return text.toLowerCase()
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
                .split(/\s+/)
                .filter(w => w.length > 3 && !stopWords.has(w));
        };

        const studentWords = getKeywords(studentText);
        const modelWords = getKeywords(modelText);
        
        const studentSet = new Set(studentWords);
        const modelSet = new Set(modelWords);

        if (modelSet.size === 0) return { overlapRatio: 0, matched: [], missing: [] };

        const matched = [];
        const missing = [];

        modelSet.forEach(word => {
            if (studentSet.has(word)) {
                matched.push(word);
            } else {
                missing.push(word);
            }
        });

        return {
            overlapRatio: matched.length / modelSet.size,
            matched: matched,
            missing: missing
        };
    },

    // Handle Form Submission and Evaluation routing
    async handleGrading() {
        const studentName = document.getElementById('student-name').value.trim();
        const subject = document.getElementById('subject-select').value;
        const question = document.getElementById('exam-question').value.trim();
        const modelAnswer = document.getElementById('model-answer').value.trim();
        const studentAnswer = document.getElementById('student-answer').value.trim();
        const maxMarks = parseInt(document.getElementById('max-marks').value, 10);

        if (!studentName || !subject || !question || !modelAnswer || !studentAnswer) {
            alert("Please fill in all the required input fields before grading.");
            return;
        }

        const studentWords = studentAnswer.split(/\s+/).length;
        if (studentWords < 10) {
            alert("Student answer must contain at least 10 words for a valid evaluation.");
            return;
        }

        // Show loading modal overlay
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text-status');
        const loadingBar = document.getElementById('loading-bar');
        
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
        
        const steps = [
            { text: "Analyzing word count and structure...", delay: 400, width: "25%" },
            { text: "Detecting relevant terminology and key vocabulary...", delay: 800, width: "50%" },
            { text: "Running local NLP alignment metrics...", delay: 1300, width: "75%" },
            { text: "Synthesizing final evaluation report...", delay: 1800, width: "100%" }
        ];

        // Animate loading text status updates
        for (const step of steps) {
            await new Promise(resolve => setTimeout(() => {
                if (loadingText) loadingText.textContent = step.text;
                if (loadingBar) loadingBar.style.width = step.width;
                resolve();
            }, step.delay));
        }

        let evaluationResult;

        try {
            if (window.app.apiKey) {
                // Call Google Gemini API
                console.log("Routing evaluation request to Gemini API...");
                evaluationResult = await this.evaluateWithGemini(
                    question,
                    modelAnswer,
                    studentAnswer,
                    maxMarks,
                    subject
                );
            } else {
                // Run fallback local heuristic engine
                console.log("Routing evaluation request to Local Heuristic Engine...");
                evaluationResult = this.evaluateLocally(
                    question,
                    modelAnswer,
                    studentAnswer,
                    maxMarks,
                    subject
                );
            }

            // Enrich the result with inputs, metadata, and timestamps
            const finalRecord = {
                id: `eval-${Date.now()}`,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                studentName,
                subject,
                question,
                modelAnswer,
                studentAnswer,
                maxMarks,
                ...evaluationResult
            };

            // Save record
            window.app.saveEvaluation(finalRecord);

            // Load into report preview module
            if (window.report && typeof window.report.loadReport === 'function') {
                window.report.loadReport(finalRecord);
            }

            // Route to report preview page
            window.app.navigateTo('report');

        } catch (error) {
            console.error("Grading failed:", error);
            alert(`Error during evaluation: ${error.message}. Switched back to screen.`);
        } finally {
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        }
    },

    // API Integration: Google Gemini AI
    async evaluateWithGemini(question, modelAnswer, studentAnswer, maxMarks, subject) {
        const apiKey = window.app.apiKey;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const promptText = `
You are an expert academic examiner and professor grading subjective exam answers.
Evaluate the Student's Answer against the Teacher's Model Answer for the given Question.

Question Context:
- Subject: ${subject}
- Question: "${question}"
- Maximum Marks: ${maxMarks}
- Model Answer (Benchmark): "${modelAnswer}"
- Student's Answer: "${studentAnswer}"

Evaluate the student's answer fairly and rigorously. Deduct marks if they missed critical facts, keywords, or definitions outlined in the Model Answer, or if they have written contradictions or logical errors. If their answer is excellent and complete, give them near full marks.

Return ONLY a JSON object representing the assessment. Do not write any markdown wrappers (like \`\`\`json) or explanation text outside the JSON. The JSON object must contain exactly these fields:
{
  "score": a decimal number representing the marks obtained (e.g. 8.5, 4.0). Must be between 0 and ${maxMarks} (with 0.5 resolution).
  "grade": a letter grade string (A+, A, B+, B, C+, C, D, F) corresponding to the score.
  "feedback": a detailed, natural, human-like feedback paragraph summarizing the answer's quality, completeness, and context (3-4 sentences).
  "strengths": a JSON array of 2 to 3 strings highlighting specific correct definitions, examples, or structures in the student's answer.
  "missingConcepts": a JSON array of 1 to 3 strings listing specific keywords, concepts, facts, or formulas from the model answer that are missing, incomplete, or incorrectly stated.
  "improvements": a JSON array of 2 to 3 strings providing actionable pedagogical recommendations for how the student can improve their score.
  "confidence": an integer between 85 and 100 representing the AI's grading confidence level.
}
`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptText }]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status} from Gemini API.`);
        }

        const data = await response.json();
        
        try {
            const rawText = data.candidates[0].content.parts[0].text.trim();
            // Sanitize raw text to prevent parse errors (strip markdown backticks if present)
            const cleanJsonText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
            const result = JSON.parse(cleanJsonText);
            
            // Normalize outputs
            result.score = parseFloat(result.score) || 0;
            if (result.score > maxMarks) result.score = maxMarks;
            result.confidence = parseInt(result.confidence, 10) || 90;
            result.engine = "Gemini AI Engine";
            
            return result;
        } catch (e) {
            console.error("Failed to parse Gemini response JSON. Raw text: ", data);
            throw new Error("Could not parse the AI's structured grading output. Please check the model output format.");
        }
    },

    // Local Fallback Heuristics Engine
    evaluateLocally(question, modelAnswer, studentAnswer, maxMarks, subject) {
        const stats = this.analyzeTextOverlap(studentAnswer, modelAnswer);
        const studentWords = studentAnswer.split(/\s+/).length;
        const modelWords = modelAnswer.split(/\s+/).length;
        
        // 1. Calculate length score ratio
        let lengthScore = Math.min(1.0, studentWords / modelWords);
        // Penalize extremely short answers heavily
        if (studentWords < 20) lengthScore *= 0.4;
        
        // 2. Compute semantic overlap match score
        const overlapScore = stats.overlapRatio;
        
        // 3. Compute final weighted ratio
        const finalRatio = (overlapScore * 0.65) + (lengthScore * 0.35);
        
        // 4. Calculate actual numerical marks (resolved to nearest 0.5)
        let rawScore = finalRatio * maxMarks;
        
        // Give small buffer for typing a lot
        if (studentWords > modelWords * 1.3) {
            rawScore += (maxMarks * 0.05);
        }
        
        let score = Math.round(rawScore * 2) / 2;
        score = Math.max(0, Math.min(maxMarks, score)); // clamp score
        
        const scorePercentage = (score / maxMarks) * 100;
        
        // 5. Predict Grade
        let grade = 'F';
        if (scorePercentage >= 95) grade = 'A+';
        else if (scorePercentage >= 85) grade = 'A';
        else if (scorePercentage >= 75) grade = 'B+';
        else if (scorePercentage >= 65) grade = 'B';
        else if (scorePercentage >= 55) grade = 'C+';
        else if (scorePercentage >= 45) grade = 'C';
        else if (scorePercentage >= 35) grade = 'D';

        // 6. Generate natural dynamic feedback and lists
        const matchedKeywords = stats.matched.map(w => w.charAt(0).toUpperCase() + w.slice(1));
        const missingKeywords = stats.missing.map(w => w.charAt(0).toUpperCase() + w.slice(1));

        let feedback = "";
        const strengths = [];
        const missingConcepts = [];
        const improvements = [];

        // Build strengths and missing lists
        if (matchedKeywords.length > 0) {
            strengths.push(`Successfully incorporated crucial vocabulary such as: ${matchedKeywords.slice(0, 3).join(', ')}.`);
            strengths.push("Shows a logical flow and alignment with the benchmark definitions.");
        } else {
            strengths.push("Attempted to construct an answer structure.");
            strengths.push("Provided a baseline textual writeup.");
        }

        if (missingKeywords.length > 0) {
            missingConcepts.push(`Did not sufficiently elaborate on key terms: ${missingKeywords.slice(0, 3).join(', ')}.`);
        }
        if (studentWords < modelWords * 0.7) {
            missingConcepts.push("The response is brief and lacks secondary supporting arguments.");
        }

        // Actionable suggestions
        improvements.push("Review the reference textbook material focusing on exact academic definitions.");
        if (missingKeywords.length > 0) {
            improvements.push(`Practice integrating terms like '${missingKeywords[0]}' and '${missingKeywords[1] || 'related concepts'}' into explanations.`);
        }
        improvements.push("Extend the length of the descriptive essay to include illustrative instances or applications.");

        // Compose feedback paragraph
        if (scorePercentage >= 85) {
            feedback = `Excellent work! The student demonstrates a comprehensive command over ${subject} concepts. The explanation is descriptive, fits the model criteria perfectly, and incorporates key vocabulary terms (${matchedKeywords.slice(0, 2).join(', ')}). Minor additions could elevate it further, but the current layout is robust.`;
        } else if (scorePercentage >= 60) {
            feedback = `Good job. The response shows a clear understanding of the fundamental topic, explaining several key parts of the question. However, it lacks depth in secondary specifications. Integrating terms like '${missingKeywords.slice(0, 2).join(', ')}' would improve clarity and precision.`;
        } else if (scorePercentage >= 40) {
            feedback = `The student answer covers the basics but remains highly incomplete. Several essential segments of the model guidelines are omitted. The student needs to expand the definitions and ensure that all technical keywords are addressed.`;
        } else {
            feedback = `The answer is too brief or contains very little relevant vocabulary to justify passing marks. Key definitions are missing, and there is minimal conceptual overlap with the teacher's model answer. Consistent review of the subject guidelines is recommended.`;
        }

        // Confidence estimation
        const confidence = Math.round(75 + (stats.overlapRatio * 15) + (Math.min(10, studentWords / 30)));

        return {
            score: score,
            grade: grade,
            feedback: feedback,
            strengths: strengths,
            missingConcepts: missingConcepts,
            improvements: improvements,
            confidence: Math.min(95, confidence),
            engine: "Local NLP Engine"
        };
    },

    // ==========================================================================
    // PDF UPLOAD & PARSING METHODS (PDF.JS CLIENT-SIDE)
    // ==========================================================================
    setupPdfListeners() {
        // Initialize PDF.js worker from CDN
        if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        } else {
            console.warn("PDF.js library not loaded yet.");
        }

        const questionFileInput = document.getElementById('upload-question-pdf');
        const modelFileInput = document.getElementById('upload-model-pdf');
        const studentFileInput = document.getElementById('upload-student-pdf');

        if (questionFileInput) {
            questionFileInput.addEventListener('change', (e) => this.handlePdfUpload(e, 'exam-question', 'loader-upload-question-pdf', 'label-upload-question-pdf'));
        }
        if (modelFileInput) {
            modelFileInput.addEventListener('change', (e) => this.handlePdfUpload(e, 'model-answer', 'loader-upload-model-pdf', 'label-upload-model-pdf'));
        }
        if (studentFileInput) {
            studentFileInput.addEventListener('change', (e) => this.handlePdfUpload(e, 'student-answer', 'loader-upload-student-pdf', 'label-upload-student-pdf', true));
        }
    },

    async handlePdfUpload(event, targetTextareaId, loaderId, labelId, isStudent = false) {
        const file = event.target.files[0];
        if (!file) return;

        const loader = document.getElementById(loaderId);
        const label = document.getElementById(labelId);
        const textarea = document.getElementById(targetTextareaId);

        if (!window.pdfjsLib) {
            alert("PDF.js library is not loaded. Cannot parse PDF file.");
            return;
        }

        if (loader) loader.style.display = 'inline-flex';
        if (label) label.style.display = 'none';

        try {
            const text = await this.extractTextFromPdf(file);
            if (textarea) {
                textarea.value = text.trim();
                // Trigger input event to update counts/richness heights
                textarea.dispatchEvent(new Event('input'));
            }
            
            // Re-run stats checks manually to guarantee sync
            if (isStudent) {
                this.updateTextStats();
            }
            this.updateQualityIndicator();

        } catch (error) {
            console.error("PDF Text Extraction failed:", error);
            alert(`Failed to extract text from PDF: ${error.message}`);
        } finally {
            if (loader) loader.style.display = 'none';
            if (label) label.style.display = 'inline-flex';
            // Clear file input value to allow re-upload of same file
            event.target.value = '';
        }
    },

    extractTextFromPdf(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const typedarray = new Uint8Array(e.target.result);
                    const loadingTask = window.pdfjsLib.getDocument({ data: typedarray });
                    const pdf = await loadingTask.promise;
                    
                    let extractedText = "";
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items
                            .map(item => item.str)
                            .join(' ')
                            .replace(/\s+/g, ' '); // normalize whitespace
                        extractedText += pageText + "\n";
                    }
                    
                    if (!extractedText.trim()) {
                        reject(new Error("No readable text found in this PDF (it might be scanned images or handwriting)."));
                    } else {
                        resolve(extractedText);
                    }
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = function(err) {
                reject(err);
            };
            reader.readAsArrayBuffer(file);
        });
    }
};
