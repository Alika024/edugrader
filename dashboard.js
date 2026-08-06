/**
 * EduGrade AI - Smart Subjective AutoGrader
 * Analytics Dashboard Renderer (dashboard.js)
 */

window.dashboard = {
    // Keep reference to chart instances to prevent overlapping drawing bugs
    charts: {
        grades: null,
        scores: null,
        subjects: null
    },

    init() {
        console.log("Initializing Dashboard Module...");
        this.updateDashboard();
    },

    // Refresh all stats, graphs, and logs
    updateDashboard() {
        const history = window.app.history || [];
        
        // 1. Calculate KPI Metrics
        this.updateKPIs(history);

        // 2. Render Charts
        this.renderCharts(history);

        // 3. Render History Logs Table
        this.renderLogsTable(history);
    },

    // Update Numerical KPI cards
    updateKPIs(history) {
        const totalGradedEl = document.getElementById('dash-total-graded');
        const avgScoreEl = document.getElementById('dash-average-score');
        const avgConfidenceEl = document.getElementById('dash-average-confidence');
        const activeCoursesEl = document.getElementById('dash-active-courses');

        if (!totalGradedEl) return;

        const total = history.length;
        totalGradedEl.textContent = total;

        if (total === 0) {
            avgScoreEl.textContent = '0.0%';
            avgConfidenceEl.textContent = '0%';
            activeCoursesEl.textContent = '0';
            return;
        }

        // Calculate average percentage
        let scorePercentSum = 0;
        let confidenceSum = 0;
        const uniqueSubjects = new Set();

        history.forEach(item => {
            scorePercentSum += (item.score / item.maxMarks) * 100;
            confidenceSum += item.confidence;
            uniqueSubjects.add(item.subject);
        });

        const avgScorePercent = (scorePercentSum / total).toFixed(1);
        const avgConfidence = Math.round(confidenceSum / total);

        avgScoreEl.textContent = `${avgScorePercent}%`;
        avgConfidenceEl.textContent = `${avgConfidence}%`;
        activeCoursesEl.textContent = uniqueSubjects.size;
    },

    // Render visual analytics using Chart.js
    renderCharts(history) {
        if (typeof window.Chart === 'undefined') {
            console.warn("Chart.js not loaded. Skipping chart rendering.");
            return;
        }

        // Detect theme to adjust font and grid colors
        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        const isDark = theme === 'dark';
        
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
        const textColor = isDark ? '#F5F6FA' : '#2F3640';
        const labelFont = {
            family: "'Poppins', 'Outfit', sans-serif",
            size: 11
        };

        const chartOptions = (title) => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: labelFont }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: labelFont }
                }
            }
        });

        // ------------------------------------------
        // CHART 1: GRADE DISTRIBUTION (Bar/Doughnut)
        // ------------------------------------------
        const gradesCanvas = document.getElementById('chart-grades');
        if (gradesCanvas) {
            // Count grades frequency
            const gradeCounts = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D': 0, 'F': 0 };
            history.forEach(item => {
                const gr = item.grade;
                if (gradeCounts[gr] !== undefined) {
                    gradeCounts[gr]++;
                } else {
                    // Fallback mapping if grade is structured slightly differently
                    const baseGrade = gr.charAt(0);
                    if (gradeCounts[baseGrade] !== undefined) gradeCounts[baseGrade]++;
                }
            });

            const labels = Object.keys(gradeCounts);
            const data = Object.values(gradeCounts);

            if (this.charts.grades) this.charts.grades.destroy();

            // Setup chart colors matching page palette variables
            const bgColors = labels.map(g => {
                if (g.startsWith('A')) return '#B8F2D6'; // Mint Green
                if (g.startsWith('B')) return '#A8D8FF'; // Sky Blue
                if (g.startsWith('C')) return '#B8A8FF'; // Lavender
                return '#FFD6BA'; // Soft Peach
            });

            const hoverBgColors = labels.map(g => {
                if (g.startsWith('A')) return '#9DE6C4';
                if (g.startsWith('B')) return '#8EC2FF';
                if (g.startsWith('C')) return '#9E8BFF';
                return '#FFAF7E';
            });

            this.charts.grades = new window.Chart(gradesCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: bgColors,
                        hoverBackgroundColor: hoverBgColors,
                        borderRadius: 8,
                        borderWidth: 0
                    }]
                },
                options: {
                    ...chartOptions('Grade Distribution'),
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: textColor, font: labelFont }
                        },
                        y: {
                            grid: { color: gridColor },
                            ticks: { 
                                stepSize: 1, 
                                precision: 0,
                                color: textColor, 
                                font: labelFont 
                            }
                        }
                    }
                }
            });
        }

        // ------------------------------------------
        // CHART 2: SCORE TREND (Line)
        // ------------------------------------------
        const scoresCanvas = document.getElementById('chart-scores');
        if (scoresCanvas) {
            // Sort history oldest to newest for chronological trend
            const sortedHistory = [...history].reverse();
            
            const labels = sortedHistory.map((item, idx) => `Test ${idx + 1}`);
            const data = sortedHistory.map(item => ((item.score / item.maxMarks) * 100).toFixed(1));

            if (this.charts.scores) this.charts.scores.destroy();

            this.charts.scores = new window.Chart(scoresCanvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        borderColor: '#B8A8FF', // Lavender Theme
                        backgroundColor: 'rgba(184, 168, 255, 0.15)',
                        borderWidth: 3,
                        pointBackgroundColor: '#B8A8FF',
                        pointBorderColor: isDark ? '#0F111A' : '#FFFDF7',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        tension: 0.35,
                        fill: true
                    }]
                },
                options: {
                    ...chartOptions('Score Trend'),
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: textColor, font: labelFont }
                        },
                        y: {
                            grid: { color: gridColor },
                            ticks: { 
                                color: textColor, 
                                font: labelFont,
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            suggestedMin: 0,
                            suggestedMax: 100
                        }
                    }
                }
            });
        }

        // ------------------------------------------
        // CHART 3: SUBJECT COMPARISON (Horizontal Bar)
        // ------------------------------------------
        const subjectsCanvas = document.getElementById('chart-subjects');
        if (subjectsCanvas) {
            // Calculate average for each subject
            const subjectStats = {};
            history.forEach(item => {
                const sub = item.subject;
                const scorePerc = (item.score / item.maxMarks) * 100;
                
                if (!subjectStats[sub]) {
                    subjectStats[sub] = { sum: 0, count: 0 };
                }
                subjectStats[sub].sum += scorePerc;
                subjectStats[sub].count++;
            });

            const labels = Object.keys(subjectStats);
            const averages = labels.map(sub => (subjectStats[sub].sum / subjectStats[sub].count).toFixed(1));

            if (this.charts.subjects) this.charts.subjects.destroy();

            // Preset gradient style color list
            const bgPastels = ['#B8A8FF', '#A8D8FF', '#B8F2D6', '#FFD6BA', '#FFE0CB'];

            this.charts.subjects = new window.Chart(subjectsCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        data: averages,
                        backgroundColor: labels.map((_, i) => bgPastels[i % bgPastels.length]),
                        borderRadius: 10,
                        barThickness: 24
                    }]
                },
                options: {
                    indexAxis: 'y', // Makes the bar chart horizontal
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            grid: { color: gridColor },
                            ticks: { 
                                color: textColor, 
                                font: labelFont,
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            suggestedMin: 0,
                            suggestedMax: 100
                        },
                        y: {
                            grid: { display: false },
                            ticks: { color: textColor, font: labelFont }
                        }
                    }
                }
            });
        }
    },

    // Render historical logs table list
    renderLogsTable(history) {
        const tableBody = document.getElementById('history-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (history.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="8" class="text-center py-4 text-muted">
                    <div class="empty-table-placeholder">
                        <i data-lucide="clipboard-list" style="width: 32px; height: 32px; color: var(--text-muted); opacity: 0.5; margin-bottom: 8px;"></i>
                        <p>No evaluations logged in database. Submit an answer to start tracking.</p>
                    </div>
                </td>
            `;
            tableBody.appendChild(emptyRow);
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        history.forEach(record => {
            const row = document.createElement('tr');
            
            // Format grade badge class based on first letter
            const gradeBase = record.grade.charAt(0);
            
            row.innerHTML = `
                <td class="date-cell">${record.timestamp}</td>
                <td class="font-weight-600">${record.studentName}</td>
                <td><span class="subject-badge">${record.subject}</span></td>
                <td><strong>${record.score}</strong> <span class="max-denominator">/ ${record.maxMarks}</span></td>
                <td><span class="table-grade-badge grade-bg-${gradeBase}">${record.grade}</span></td>
                <td>
                    <div class="table-confidence-wrapper">
                        <div class="confidence-circle" style="background: conic-gradient(var(--primary-lavender) ${record.confidence}%, transparent ${record.confidence}%);"></div>
                        <span>${record.confidence}%</span>
                    </div>
                </td>
                <td class="text-muted text-xs">${record.engine}</td>
                <td>
                    <div class="table-action-buttons">
                        <button class="btn-action-view" onclick="dashboard.viewReport('${record.id}')" title="Inspect Grading Report">
                            <i data-lucide="file-search"></i>
                        </button>
                        <button class="btn-action-delete" onclick="dashboard.deleteRecord('${record.id}')" title="Delete Record">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });

        // Initialize Lucide icons for the newly created button tags
        if (window.lucide) {
            window.lucide.createIcons();
        }
    },

    // Actions
    viewReport(id) {
        const record = window.app.history.find(item => item.id === id);
        if (record) {
            if (window.report && typeof window.report.loadReport === 'function') {
                window.report.loadReport(record);
            }
            window.app.navigateTo('report');
        }
    },

    deleteRecord(id) {
        if (confirm("Are you sure you want to permanently delete this grading entry from the logs?")) {
            window.app.deleteEvaluation(id);
        }
    }
};
