// Utility functions
class CraneErrorApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.checkAuthentication();
    }

    async checkAuthentication() {
        try {
            const response = await fetch('/api/user');
            if (response.ok) {
                const user = await response.json();
                this.currentUser = user;
                return true;
            } else {
                this.redirectToLogin();
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.redirectToLogin();
            return false;
        }
    }

    redirectToLogin() {
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('signup.html')) {
            window.location.href = 'login.html';
        }
    }

    async logout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            this.currentUser = null;
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    async loadErrors() {
        try {
            const response = await fetch('/api/errors');
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Failed to load errors');
            }
        } catch (error) {
            console.error('Error loading errors:', error);
            return [];
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Failed to load stats');
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            return null;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
}

// Global app instance
const app = new CraneErrorApp();

// Utility function to check authentication on page load
async function checkAuth() {
    try {
        const response = await fetch('/api/user');
        if (!response.ok) {
            if (!window.location.pathname.includes('login.html') && 
                !window.location.pathname.includes('signup.html')) {
                window.location.href = 'login.html';
            }
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('signup.html')) {
            window.location.href = 'login.html';
        }
    }
}

// Dashboard specific functionality
if (window.location.pathname.includes('dashboard.html')) {
    document.addEventListener('DOMContentLoaded', async function() {
        await loadDashboard();
    });

    async function loadDashboard() {
        const stats = await app.loadStats();
        const errors = await app.loadErrors();

        if (stats) {
            updateStats(stats);
        }

        if (errors.length > 0) {
            displayRecentErrors(errors);
        }
    }

    function updateStats(stats) {
        document.getElementById('totalErrors').textContent = stats.totalErrors;
        document.getElementById('openErrors').textContent = stats.openErrors;
        document.getElementById('inProgressErrors').textContent = stats.inProgressErrors;
        document.getElementById('resolvedErrors').textContent = stats.resolvedErrors;
    }

    function displayRecentErrors(errors) {
        const errorList = document.getElementById('recentErrors');
        const recentErrors = errors.slice(0, 5); // Show last 5 errors

        errorList.innerHTML = recentErrors.map(error => `
            <div class="error-item">
                <div>
                    <strong>${error.craneId}</strong> - ${error.errorType}
                    <br>
                    <small>${app.formatDate(error.timestamp)}</small>
                </div>
                <div>
                    <span class="error-severity severity-${error.severity.toLowerCase()}">
                        ${error.severity}
                    </span>
                    <span class="error-status status-${error.status.toLowerCase().replace(' ', '-')}">
                        ${error.status}
                    </span>
                </div>
            </div>
        `).join('');
    }
}

// Error reporting functionality
if (window.location.pathname.includes('entry-mode.html') || 
    window.location.pathname.includes('manual-entry.html')) {
    
    document.addEventListener('DOMContentLoaded', function() {
        const errorForm = document.getElementById('errorForm');
        if (errorForm) {
            errorForm.addEventListener('submit', handleErrorSubmit);
        }
    });

    async function handleErrorSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const errorData = {
            craneId: formData.get('craneId'),
            errorType: formData.get('errorType'),
            severity: formData.get('severity'),
            description: formData.get('description'),
            location: formData.get('location')
        };

        try {
            const response = await fetch('/api/errors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(errorData)
            });

            if (response.ok) {
                alert('Error reported successfully!');
                e.target.reset();
                window.location.href = 'dashboard.html';
            } else {
                throw new Error('Failed to submit error report');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('Failed to submit error report. Please try again.');
        }
    }
}

// QR Scanner functionality
if (window.location.pathname.includes('qr-scanner.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        initializeQRScanner();
    });

    function initializeQRScanner() {
        const video = document.getElementById('qr-video');
        const result = document.getElementById('qr-result');

        // Check if browser supports camera access
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(function(stream) {
                    video.srcObject = stream;
                    video.play();
                })
                .catch(function(error) {
                    console.error('Camera error:', error);
                    result.textContent = 'Cannot access camera: ' + error.message;
                });
        } else {
            result.textContent = 'Camera access not supported by this browser.';
        }

        // Simple QR code detection (for demo purposes)
        // In a real application, you would use a library like jsQR
        video.addEventListener('play', function() {
            result.textContent = 'Camera started. Point at a QR code.';
            
            // Simulate QR code detection for demo
            setTimeout(() => {
                result.innerHTML = 'QR Code detected!<br>Demo Mode: Crane ID: CRN-001<br>Redirecting to manual entry...';
                setTimeout(() => {
                    window.location.href = 'manual-entry.html?craneId=CRN-001';
                }, 2000);
            }, 3000);
        });
    }
}
