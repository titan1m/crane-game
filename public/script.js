class QuizApp {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('token');
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.setupEventListeners();
        this.loadCurrentPage();
    }

    checkAuthentication() {
        if (this.token) {
            this.fetchUserProfile();
        } else {
            this.showAuthPages();
        }
    }

    async fetchUserProfile() {
        try {
            const response = await fetch('/api/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.currentUser = await response.json();
                this.showAuthenticatedPages();
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            this.logout();
        }
    }

    showAuthPages() {
        this.hideAllPages();
        if (window.location.pathname.endsWith('login.html') || 
            window.location.pathname.endsWith('register.html')) {
            return;
        }
        window.location.href = 'login.html';
    }

    showAuthenticatedPages() {
        if (window.location.pathname.endsWith('login.html') || 
            window.location.pathname.endsWith('register.html')) {
            window.location.href = 'index.html';
        }
        this.updateNavigation();
    }

    hideAllPages() {
        // Implementation for single page app would go here
    }

    updateNavigation() {
        const authElements = document.querySelectorAll('.auth-only');
        const guestElements = document.querySelectorAll('.guest-only');
        
        if (this.currentUser) {
            authElements.forEach(el => el.style.display = 'block');
            guestElements.forEach(el => el.style.display = 'none');
            
            const userElements = document.querySelectorAll('.user-name');
            userElements.forEach(el => {
                el.textContent = this.currentUser.username;
            });
        } else {
            authElements.forEach(el => el.style.display = 'none');
            guestElements.forEach(el => el.style.display = 'block');
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-page]')) {
                e.preventDefault();
                this.navigateTo(e.target.getAttribute('data-page'));
            }
        });

        document.addEventListener('submit', (e) => {
            if (e.target.matches('#login-form')) {
                e.preventDefault();
                this.handleLogin();
            } else if (e.target.matches('#register-form')) {
                e.preventDefault();
                this.handleRegister();
            } else if (e.target.matches('#quiz-form')) {
                e.preventDefault();
                this.handleQuizSubmit();
            }
        });
    }

    async handleLogin() {
        const formData = new FormData(document.getElementById('login-form'));
        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.token = result.token;
                localStorage.setItem('token', this.token);
                this.currentUser = result.user;
                window.location.href = 'index.html';
            } else {
                this.showError('login-error', result.message);
            }
        } catch (error) {
            this.showError('login-error', 'An error occurred during login');
        }
    }

    async handleRegister() {
        const formData = new FormData(document.getElementById('register-form'));
        const data = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.token = result.token;
                localStorage.setItem('token', this.token);
                this.currentUser = result.user;
                window.location.href = 'index.html';
            } else {
                this.showError('register-error', result.message);
            }
        } catch (error) {
            this.showError('register-error', 'An error occurred during registration');
        }
    }

    async handleQuizSubmit() {
        const formData = new FormData(document.getElementById('quiz-form'));
        const answers = [];
        
        document.querySelectorAll('.question').forEach((question, index) => {
            const selectedOption = question.querySelector('input[type="radio"]:checked');
            if (selectedOption) answers.push(parseInt(selectedOption.value));
        });

        try {
            const response = await fetch('/api/quiz/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    score: this.calculateScore(answers),
                    totalQuestions: answers.length
                })
            });

            if (response.ok) window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Error submitting quiz:', error);
        }
    }

    calculateScore(answers) {
        return answers.filter((answer, index) => answer === index % 4).length;
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    logout() {
        localStorage.removeItem('token');
        this.token = null;
        this.currentUser = null;
        window.location.href = 'login.html';
    }

    navigateTo(page) {
        window.location.href = page;
    }

    // ----------------- UPDATED LOAD CURRENT PAGE -----------------
    loadCurrentPage() {
        const path = window.location.pathname;
        if (path.endsWith('dashboard.html')) this.loadDashboard();
        else if (path.endsWith('leaderboard.html')) this.loadLeaderboard();
        else if (path.endsWith('quiz.html')) this.loadQuiz();
        else if (path.endsWith('profile.html')) this.loadProfile();
        else if (path.endsWith('achievements.html')) this.loadAchievements();
    }

    async loadDashboard() {
        if (!this.currentUser) return;

        document.getElementById('user-score').textContent = this.currentUser.score;
        document.getElementById('games-played').textContent = this.currentUser.gamesPlayed;

        this.loadAchievements();
    }

    async loadLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            const leaders = await response.json();
            
            const leaderboardList = document.getElementById('leaderboard-list');
            leaderboardList.innerHTML = leaders.map((user, index) => `
                <div class="leaderboard-item ${index < 3 ? 'top-three' : ''}">
                    <span>${index + 1}. ${user.username}</span>
                    <span>Score: ${user.score}</span>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    }

    async loadQuiz() {
        try {
            const response = await fetch('/api/quiz', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const questions = await response.json();
            
            const quizContainer = document.getElementById('quiz-container');
            quizContainer.innerHTML = questions.map((question, index) => `
                <div class="question-card">
                    <h3>Question ${index + 1}: ${question.question}</h3>
                    <div class="options">
                        ${question.options.map((option, optIndex) => `
                            <label>
                                <input type="radio" name="question-${question.id}" value="${optIndex}">
                                ${option}
                            </label>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading quiz:', error);
        }
    }

    loadAchievements() {
        if (!this.currentUser) return;

        const achievementsContainer = document.getElementById('achievements-list');
        if (achievementsContainer) {
            achievementsContainer.innerHTML = this.currentUser.achievements.map(achievement => `
                <div class="achievement-card">
                    <h4>${achievement}</h4>
                    <p>Unlocked!</p>
                </div>
            `).join('');
        }
    }

    // ----------------- LOAD PROFILE -----------------
    async loadProfile() {
        if (!this.currentUser) return;

        const profileInfo = document.getElementById('profile-info');
        if (profileInfo) {
            profileInfo.innerHTML = `
                <div class="profile-details">
                    <p><strong>Username:</strong> ${this.currentUser.username}</p>
                    <p><strong>Email:</strong> ${this.currentUser.email}</p>
                    <p><strong>Total Score:</strong> ${this.currentUser.score}</p>
                    <p><strong>Games Played:</strong> ${this.currentUser.gamesPlayed}</p>
                    <p><strong>Member Since:</strong> ${new Date(this.currentUser.createdAt).toLocaleDateString()}</p>
                </div>
            `;
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.quizApp = new QuizApp();
});

// API call helper
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        }
    };

    try {
        const response = await fetch(endpoint, { ...defaultOptions, ...options });
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}
