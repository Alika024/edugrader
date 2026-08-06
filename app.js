/**
 * EduGrade AI - Smart Subjective AutoGrader
 * Core Application Manager (app.js)
 */

// Global Application State
window.app = {
    // Current active page ID
    currentPage: 'home',
    
    // API status state
    apiKey: '',
    
    // In-memory data store for evaluations
    history: [],

    // Initialize application components
    init() {
        console.log("Initializing EduGrade AI Application...");
        
        // 1. Load API Key from localStorage
        this.apiKey = localStorage.getItem('gemini_api_key') || '';
        const apiInput = document.getElementById('gemini-api-key');
        if (apiInput && this.apiKey) {
            apiInput.value = this.apiKey;
        }
        this.updateApiStatus();

        // 2. Initialize dark/light theme
        this.initTheme();

        // 3. Load or seed grading history
        this.initHistory();

        // 4. Set up routing listeners
        this.initRouting();

        // 5. Setup mobile menu toggle
        this.initMobileMenu();

        // 6. Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Initialize sub-modules
        if (window.grader && typeof window.grader.init === 'function') {
            window.grader.init();
        }
        if (window.dashboard && typeof window.dashboard.init === 'function') {
            window.dashboard.init();
        }
        if (window.report && typeof window.report.init === 'function') {
            window.report.init();
        }

        // Route to Home initially
        this.navigateTo('home');
    },

    // Routing System for SPA structure
    initRouting() {
        const navButtons = document.querySelectorAll('.sidebar-menu .nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const pageId = btn.getAttribute('data-page');
                this.navigateTo(pageId);
            });
        });

        // Setup API key config button click
        const apiConfigBtn = document.getElementById('api-config-btn');
        if (apiConfigBtn) {
            apiConfigBtn.addEventListener('click', () => {
                this.toggleApiModal(true);
            });
        }
    },

    navigateTo(pageId) {
        console.log(`Navigating to page: ${pageId}`);
        
        // Hide all pages, show active page
        const sections = document.querySelectorAll('.page-section');
        sections.forEach(sec => {
            sec.classList.remove('active');
        });
        
        const activeSection = document.getElementById(`page-${pageId}`);
        if (activeSection) {
            activeSection.classList.add('active');
            this.currentPage = pageId;
        } else {
            console.error(`Page section page-${pageId} not found`);
            return;
        }

        // Highlight active nav button
        const navButtons = document.querySelectorAll('.sidebar-menu .nav-btn');
        navButtons.forEach(btn => {
            if (btn.getAttribute('data-page') === pageId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update header bar title
        const pageTitles = {
            'home': 'Home Portal',
            'about': 'About the Project',
            'grader': 'AI AutoGrader Engine',
            'dashboard': 'Analytics Dashboard',
            'report': 'Assessment Report Preview',
            'developer': 'Developer Profile'
        };
        const titleEl = document.getElementById('current-page-title');
        if (titleEl) {
            titleEl.textContent = pageTitles[pageId] || 'EduGrade AI';
        }

        // Trigger updates depending on page
        if (pageId === 'dashboard' && window.dashboard && typeof window.dashboard.updateDashboard === 'function') {
            window.dashboard.updateDashboard();
        } else if (pageId === 'report' && window.report && typeof window.report.checkState === 'function') {
            window.report.checkState();
        }

        // Smooth scroll main content to top
        const mainEl = document.querySelector('.main-content');
        if (mainEl) {
            mainEl.scrollTop = 0;
        }

        // Close mobile sidebar on navigation
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('mobile-active')) {
            sidebar.classList.remove('mobile-active');
        }
    },

    // Theme Management (Light / Dark Mode)
    initTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        const root = document.documentElement;
        
        // Check saved theme or system preferred
        const savedTheme = localStorage.getItem('theme') || 'light';
        root.setAttribute('data-theme', savedTheme);
        this.updateThemeIcons(savedTheme);

        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = root.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                root.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                this.updateThemeIcons(newTheme);
                
                // Re-render dashboard charts to update grid lines and label colors
                if (this.currentPage === 'dashboard' && window.dashboard && typeof window.dashboard.updateDashboard === 'function') {
                    window.dashboard.updateDashboard();
                }
            });
        }
    },

    updateThemeIcons(theme) {
        const moonIcon = document.querySelector('.theme-icon-dark');
        const sunIcon = document.querySelector('.theme-icon-light');
        const actionText = document.querySelector('#theme-toggle .action-text');

        if (moonIcon && sunIcon) {
            if (theme === 'dark') {
                moonIcon.style.display = 'none';
                sunIcon.style.display = 'inline-block';
                if (actionText) actionText.textContent = 'Light Mode';
            } else {
                moonIcon.style.display = 'inline-block';
                sunIcon.style.display = 'none';
                if (actionText) actionText.textContent = 'Dark Mode';
            }
        }
    },

    // History and Database Management
    initHistory() {
        const storedHistory = localStorage.getItem('grading_history');
        if (storedHistory) {
            try {
                this.history = JSON.parse(storedHistory);
                console.log(`Loaded ${this.history.length} records from history.`);
                return;
            } catch (e) {
                console.error("Error parsing history, reseeding data...", e);
            }
        }

        // Seed with high quality mock evaluations for demonstration
        const mockHistory = [
            {
                id: "eval-01",
                timestamp: "2026-07-09 10:15",
                studentName: "Emily Davis",
                subject: "Computer Science",
                question: "Explain the ACID properties of a database transaction in detail.",
                modelAnswer: "ACID stands for Atomicity, Consistency, Isolation, and Durability. Atomicity ensures all parts of a transaction succeed or all fail. Consistency guarantees that a transaction transforms the database from one valid state to another. Isolation ensures concurrent transactions execute without interference. Durability guarantees that completed transaction effects are permanent even during a system crash.",
                studentAnswer: "ACID properties are key in databases. Atomicity means a transaction is all or nothing - if a part fails, the whole thing rollbacks. Consistency ensures the database stays valid according to its schemas and rules. Isolation makes sure multiple users modifying data at the same time don't interfere with each other, keeping queries separate. Durability means that once a transaction commits, the data is saved permanently in memory or disk and won't be lost even if the power cuts out.",
                maxMarks: 10,
                score: 9.5,
                grade: "A+",
                confidence: 96,
                engine: "Gemini AI Engine",
                feedback: "Excellent work! The student has accurately defined and explained each component of the ACID properties. The descriptions are concise, correct, and represent a firm grasp of transactional integrity in databases.",
                strengths: [
                    "Precise explanations of Atomicity ('all or nothing') and Durability ('saved permanently even during power cuts')",
                    "Clear understanding of isolation in a multi-user context",
                    "Strong structuring matching standard definitions"
                ],
                missingConcepts: [
                    "Did not explicitly mention concurrency control protocols (e.g., locks or serialization levels)"
                ],
                improvements: [
                    "Include examples of database engines implementing ACID (like PostgreSQL or MySQL InnoDB).",
                    "Describe how transaction logs/journals are used to satisfy Durability."
                ]
            },
            {
                id: "eval-02",
                timestamp: "2026-07-09 11:22",
                studentName: "John Doe",
                subject: "Physics",
                question: "State Newton's Universal Law of Gravitation and write its mathematical formula.",
                modelAnswer: "Newton's Law of Universal Gravitation states that every particle attracts every other particle in the universe with a force proportional to the product of their masses and inversely proportional to the square of the distance between their centers. The formula is F = G * (m1 * m2) / r^2 where G is the gravitational constant.",
                studentAnswer: "Newton's law of gravitation says that any two objects attract each other with a gravitational force. The force depends on how heavy the objects are (mass) and the distance between them. The formula is F = m1*m2/r.",
                maxMarks: 5,
                score: 3.5,
                grade: "B",
                confidence: 85,
                engine: "Local NLP Engine",
                feedback: "Good attempt, but key mathematical details are missing. The student understands that force depends on mass and distance, but failed to specify the inverse-square relationship or include the gravitational constant G in the formula.",
                strengths: [
                    "Correctly identifies that gravitational force is attractive",
                    "Recognizes that mass and distance are the core variables involved"
                ],
                missingConcepts: [
                    "Failed to state the inverse-square law dependency (force is proportional to 1/r^2)",
                    "Missed the Universal Gravitational Constant (G) in both statement and equation"
                ],
                improvements: [
                    "Always write the complete mathematical formula including constants, e.g., F = G*(m1*m2)/r^2.",
                    "Explicitly state that force decreases with the square of the distance, not just distance."
                ]
            },
            {
                id: "eval-03",
                timestamp: "2026-07-09 13:45",
                studentName: "Sarah Connor",
                subject: "Environmental Science",
                question: "Explain the greenhouse effect and list three major greenhouse gases.",
                modelAnswer: "The greenhouse effect is the natural process where greenhouse gases in Earth's atmosphere trap solar radiation (infra-red heat) reflected off the surface, keeping the planet warm enough to support life. Human activities have accelerated this. The three main greenhouse gases are Carbon Dioxide (CO2), Methane (CH4), and Water Vapor (H2O) or Nitrous Oxide (N2O).",
                studentAnswer: "The greenhouse effect is when the earth gets warm because gases trap heat from the sun. The sun rays come in, hit the ground, and then are trapped by the atmosphere. Without this, the earth would be freezing. Three gases are carbon dioxide, oxygen, and nitrogen.",
                maxMarks: 10,
                score: 6.0,
                grade: "C+",
                confidence: 88,
                engine: "Local NLP Engine",
                feedback: "The student provides a decent basic explanation of the greenhouse effect mechanism. However, there is a major misconception regarding greenhouse gases. Oxygen and Nitrogen make up 99% of the atmosphere but are not greenhouse gases.",
                strengths: [
                    "Correct description of solar rays entering and heat getting trapped in the atmosphere",
                    "Acknowledges the importance of the greenhouse effect in maintaining Earth's temperature"
                ],
                missingConcepts: [
                    "Identified Oxygen and Nitrogen incorrectly as greenhouse gases",
                    "Missed mentioning Methane (CH4) or Water Vapor as active greenhouse gases"
                ],
                improvements: [
                    "Review atmospheric chemistry: remember that diatomic gases like O2 and N2 do not trap infrared radiation.",
                    "Name CO2, CH4, and N2O as the primary greenhouse gases of concern for climate change."
                ]
            },
            {
                id: "eval-04",
                timestamp: "2026-07-09 15:30",
                studentName: "Michael Scott",
                subject: "Business Management",
                question: "What is a SWOT analysis and how is it used in business planning?",
                modelAnswer: "SWOT analysis stands for Strengths, Weaknesses, Opportunities, and Threats. Strengths and Weaknesses are internal factors within the organization (e.g., staff, resources, IP). Opportunities and Threats are external factors in the environment (e.g., market trends, competitors, regulation). It is used to align internal capacities with market conditions to formulate strategies.",
                studentAnswer: "SWOT stands for Strengths, Weaknesses, Opportunities, and Threats. Strengths are things your company does well, like great staff or a popular brand. Weaknesses are problems inside, like bad organization or high debt. Opportunities are things outside you can take advantage of, like a competitor closing down or a new law. Threats are things that could hurt you from the outside, like new competitors or bad economy. Businesses use this to map out a matrix and decide their future moves.",
                maxMarks: 10,
                score: 9.8,
                grade: "A+",
                confidence: 94,
                engine: "Gemini AI Engine",
                feedback: "Outstanding work! The response provides clear, well-supported definitions for all components of SWOT. The student correctly distinguishes between internal factors (Strengths/Weaknesses) and external factors (Opportunities/Threats) with highly practical examples.",
                strengths: [
                    "Flawless expansion of the acronym SWOT",
                    "Accurate classification of internal vs external factors",
                    "Excellent real-world business examples for each category"
                ],
                missingConcepts: [],
                improvements: [
                    "To make it perfect, discuss how SWOT maps into action items, such as using strengths to capture opportunities (S-O strategies) in a TOWS matrix."
                ]
            }
        ];

        this.history = mockHistory;
        localStorage.setItem('grading_history', JSON.stringify(mockHistory));
    },

    saveEvaluation(record) {
        this.history.unshift(record); // Add to beginning of array
        localStorage.setItem('grading_history', JSON.stringify(this.history));
        
        // Synch dashboard
        if (window.dashboard && typeof window.dashboard.updateDashboard === 'function') {
            window.dashboard.updateDashboard();
        }
    },

    deleteEvaluation(id) {
        this.history = this.history.filter(item => item.id !== id);
        localStorage.setItem('grading_history', JSON.stringify(this.history));
        
        // Refresh dashboard UI
        if (window.dashboard && typeof window.dashboard.updateDashboard === 'function') {
            window.dashboard.updateDashboard();
        }
    },

    clearGradingHistory() {
        if (confirm("Are you sure you want to clear all grading records and logs? This will reset the database.")) {
            this.history = [];
            localStorage.setItem('grading_history', JSON.stringify([]));
            
            if (window.dashboard && typeof window.dashboard.updateDashboard === 'function') {
                window.dashboard.updateDashboard();
            }
            
            // If we are currently showing a report, reload report view state
            if (window.report && typeof window.report.checkState === 'function') {
                window.report.checkState();
            }
            
            alert("Database logs cleared successfully.");
        }
    },

    // Mobile Navigation & Responsive sidebar
    initMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('mobile-active');
            });
            
            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (sidebar.classList.contains('mobile-active') && !sidebar.contains(e.target) && e.target !== mobileToggle) {
                    sidebar.classList.remove('mobile-active');
                }
            });
        }
    },

    // API Key Configuration Methods
    toggleApiModal(show) {
        const modal = document.getElementById('api-modal-overlay');
        if (modal) {
            modal.style.display = show ? 'flex' : 'none';
        }
    },

    toggleKeyVisibility() {
        const keyInput = document.getElementById('gemini-api-key');
        const visibilityIcon = document.getElementById('key-visibility-icon');
        if (keyInput && visibilityIcon) {
            if (keyInput.type === 'password') {
                keyInput.type = 'text';
                visibilityIcon.setAttribute('data-lucide', 'eye-off');
            } else {
                keyInput.type = 'password';
                visibilityIcon.setAttribute('data-lucide', 'eye');
            }
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    },

    saveApiKey() {
        const keyInput = document.getElementById('gemini-api-key');
        if (keyInput) {
            const key = keyInput.value.trim();
            if (key) {
                this.apiKey = key;
                localStorage.setItem('gemini_api_key', key);
                this.updateApiStatus();
                this.toggleApiModal(false);
                alert("Gemini API Key saved successfully. Live grading is now active.");
            } else {
                alert("Please enter a valid API Key.");
            }
        }
    },

    clearApiKey() {
        this.apiKey = '';
        localStorage.removeItem('gemini_api_key');
        const keyInput = document.getElementById('gemini-api-key');
        if (keyInput) {
            keyInput.value = '';
        }
        this.updateApiStatus();
        this.toggleApiModal(false);
        alert("API Key removed. Switched to Local evaluation mode.");
    },

    updateApiStatus() {
        const badge = document.getElementById('api-status-badge');
        const instruction = document.getElementById('api-indicator-instruction');
        
        if (badge) {
            if (this.apiKey) {
                badge.className = 'api-status-badge active';
                badge.querySelector('.status-text').textContent = 'Gemini AI Active';
                if (instruction) {
                    instruction.innerHTML = 'The AutoGrader is operating in <strong>Gemini AI Mode</strong>. Evaluator uses live cloud generative AI to analyze logic, vocabulary, structures, and grading metrics.';
                }
            } else {
                badge.className = 'api-status-badge inactive';
                badge.querySelector('.status-text').textContent = 'Local Mode';
                if (instruction) {
                    instruction.innerHTML = 'The AutoGrader is operating in <strong>Local Mode</strong>. Evaluation is fast and calculates scores based on keyword coverage, length parameters, and structural rules.';
                }
            }
        }
    }
};

// Initialize Application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});
