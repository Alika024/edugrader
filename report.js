/**
 * EduGrade AI - Smart Subjective AutoGrader
 * Report Renderer & PDF Exporter (report.js)
 */

window.report = {
    // Reference to the currently loaded evaluation record
    currentRecord: null,

    init() {
        console.log("Initializing Report Module...");
        this.checkState();
    },

    // Check if there is a report to show
    checkState() {
        const blankState = document.getElementById('report-blank-state');
        const viewContainer = document.getElementById('report-view-container');

        if (!blankState || !viewContainer) return;

        if (this.currentRecord) {
            blankState.style.display = 'none';
            viewContainer.style.display = 'block';
            this.renderRecord();
        } else {
            // Check if there is any history, load the most recent one
            if (window.app.history && window.app.history.length > 0) {
                this.currentRecord = window.app.history[0];
                blankState.style.display = 'none';
                viewContainer.style.display = 'block';
                this.renderRecord();
            } else {
                blankState.style.display = 'flex';
                viewContainer.style.display = 'none';
            }
        }
    },

    // Load a specific record into the report preview
    loadReport(record) {
        this.currentRecord = record;
        this.checkState();
    },

    // Render current record into elements
    renderRecord() {
        const record = this.currentRecord;
        if (!record) return;

        // Metadata
        const timestampEl = document.getElementById('report-timestamp');
        if (timestampEl) timestampEl.textContent = `Date: ${record.timestamp}`;

        const nameEl = document.getElementById('rep-student-name');
        if (nameEl) nameEl.textContent = record.studentName;

        const subjectEl = document.getElementById('rep-subject');
        if (subjectEl) subjectEl.textContent = record.subject;

        const maxMarksEl = document.getElementById('rep-max-marks');
        if (maxMarksEl) maxMarksEl.textContent = `${record.maxMarks} Marks`;

        const engineEl = document.getElementById('rep-engine');
        if (engineEl) engineEl.textContent = record.engine;

        // Scores
        const scoreEl = document.getElementById('rep-score-obtained');
        if (scoreEl) scoreEl.textContent = record.score;

        const scoreDenomEl = document.getElementById('rep-score-denominator');
        if (scoreDenomEl) scoreDenomEl.textContent = `/ ${record.maxMarks}`;

        const gradeEl = document.getElementById('rep-grade');
        if (gradeEl) {
            gradeEl.textContent = record.grade;
            // Remove old grade color classes and set new one
            gradeEl.className = 'grade-value';
            const gradeBase = record.grade.charAt(0);
            gradeEl.classList.add(`grade-color-${gradeBase}`);
        }

        // SVG progress ring animation
        const circle = document.getElementById('report-progress-circle');
        if (circle) {
            const radius = 70;
            const circumference = 2 * Math.PI * radius; // ~439.82
            
            circle.style.strokeDasharray = circumference;
            circle.style.strokeDashoffset = circumference; // Start fully hidden
            
            // Calculate ratio and offset
            const scoreRatio = record.score / record.maxMarks;
            const offset = circumference - (scoreRatio * circumference);
            
            // Trigger animation frame for transition
            requestAnimationFrame(() => {
                circle.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
                circle.style.strokeDashoffset = offset;
            });
        }

        // Confidence
        const confidenceBar = document.getElementById('rep-confidence-bar');
        const confidenceVal = document.getElementById('rep-confidence-value');
        if (confidenceBar) confidenceBar.style.width = `${record.confidence}%`;
        if (confidenceVal) confidenceVal.textContent = `${record.confidence}%`;

        // Text blocks
        const questionEl = document.getElementById('rep-question');
        if (questionEl) questionEl.textContent = record.question;

        const ansEl = document.getElementById('rep-student-answer');
        if (ansEl) ansEl.textContent = record.studentAnswer;

        const generalFeedbackEl = document.getElementById('rep-general-feedback');
        if (generalFeedbackEl) generalFeedbackEl.innerHTML = `"${record.feedback}"`;

        // Dynamic Lists Helper
        const renderList = (elementId, items) => {
            const listEl = document.getElementById(elementId);
            if (!listEl) return;
            
            listEl.innerHTML = '';
            if (items && items.length > 0) {
                items.forEach(item => {
                    const li = document.createElement('li');
                    
                    // Inject appropriate Lucide check/cross icon inside list items
                    let iconHtml = '';
                    if (elementId === 'rep-strengths') {
                        iconHtml = '<i data-lucide="check-circle" class="list-bullet text-success"></i>';
                    } else if (elementId === 'rep-missing-concepts') {
                        iconHtml = '<i data-lucide="x-circle" class="list-bullet text-warning"></i>';
                    } else {
                        iconHtml = '<i data-lucide="arrow-right-circle" class="list-bullet text-primary"></i>';
                    }
                    
                    li.innerHTML = `${iconHtml}<span>${item}</span>`;
                    listEl.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.innerHTML = '<span class="text-muted">None flagged.</span>';
                listEl.appendChild(li);
            }
        };

        // Render the lists
        renderList('rep-strengths', record.strengths);
        renderList('rep-missing-concepts', record.missingConcepts);
        renderList('rep-improvements', record.improvements);

        // Re-run Lucide creation for the lists icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    },

    // Clipboard feedback copy
    copyFeedback() {
        const record = this.currentRecord;
        if (!record) return;

        const textToCopy = `EduGrade AI assessment Report
--------------------------------------
Student: ${record.studentName}
Subject: ${record.subject}
Score: ${record.score}/${record.maxMarks} (${record.grade})
AI Confidence: ${record.confidence}%

Teacher Feedback:
"${record.feedback}"

Key Strengths:
${record.strengths.map(s => `- ${s}`).join('\n')}

Omissions / Missing Concepts:
${record.missingConcepts.map(m => `- ${m}`).join('\n')}

Actionable Improvements:
${record.improvements.map(i => `- ${i}`).join('\n')}
`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            const copyBtn = document.getElementById('btn-copy-feedback');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i data-lucide="check"></i><span>Feedback Copied!</span>';
                if (window.lucide) window.lucide.createIcons();
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    if (window.lucide) window.lucide.createIcons();
                }, 2000);
            }
        }).catch(err => {
            console.error("Clipboard copy failed: ", err);
            alert("Failed to copy feedback to clipboard. Please copy manually.");
        });
    },

    // Download high-resolution print PDF
    downloadPDF() {
        const record = this.currentRecord;
        if (!record) return;

        const element = document.getElementById('report-card-to-print');
        if (!element) return;

        // Temporarily style element for optimal print layout
        element.classList.add('pdf-printing');
        
        // Generate filename
        const safeName = record.studentName.trim().replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `EduGrade_Report_${safeName}_${record.subject.replace(/\s+/g, '_')}.pdf`;

        // html2pdf config options
        const opt = {
            margin: [12, 12, 12, 12],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                logging: false,
                letterRendering: true
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait' 
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        const downloadBtn = document.getElementById('btn-download-pdf');
        let originalBtnHtml = '';
        if (downloadBtn) {
            originalBtnHtml = downloadBtn.innerHTML;
            downloadBtn.innerHTML = '<i data-lucide="loader" class="animate-spin"></i><span>Exporting PDF...</span>';
            if (window.lucide) window.lucide.createIcons();
            downloadBtn.disabled = true;
        }

        // Run pdf creator
        window.html2pdf()
            .set(opt)
            .from(element)
            .save()
            .then(() => {
                console.log("PDF report exported successfully.");
            })
            .catch(err => {
                console.error("PDF export error: ", err);
                alert("An error occurred while exporting the PDF report.");
            })
            .finally(() => {
                element.classList.remove('pdf-printing');
                if (downloadBtn) {
                    downloadBtn.innerHTML = originalBtnHtml;
                    if (window.lucide) window.lucide.createIcons();
                    downloadBtn.disabled = false;
                }
            });
    }
};
