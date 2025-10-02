// Main Application Class
class CraneErrorApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.checkAuthentication();
        this.setupGlobalEventListeners();
    }

    async checkAuthentication() {
        try {
            const response = await fetch('/api/user');
            if (response.ok) {
                const user = await response.json();
                this.currentUser = user;
                this.updateUIForAuthState(true);
                return true;
            }
            this.updateUIForAuthState(false);
            return false;
        } catch (error) {
            console.error('Auth check failed:', error);
            this.updateUIForAuthState(false);
            return false;
        }
    }

    updateUIForAuthState(isAuthenticated) {
        const authElements = document.querySelectorAll('[data-auth]');
        authElements.forEach(element => {
            const authState = element.getAttribute('data-auth');
            if ((authState === 'authenticated' && !isAuthenticated) || 
                (authState === 'anonymous' && isAuthenticated)) {
                element.style.display = 'none';
            } else {
                element.style.display = '';
            }
        });

        if (isAuthenticated && this.currentUser) {
            this.updateUserInfo();
        }
    }

    updateUserInfo() {
        const userElements = document.querySelectorAll('[data-user]');
        userElements.forEach(element => {
            const property = element.getAttribute('data-user');
            if (this.currentUser && this.currentUser[property]) {
                element.textContent = this.currentUser[property];
            }
        });
    }

    async logout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            this.currentUser = null;
            this.showNotification('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        } catch (error) {
            console.error('Logout failed:', error);
            this.showNotification('Logout failed', 'error');
        }
    }

    async loadErrors() {
        try {
            const response = await fetch('/api/errors');
            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to load errors');
        } catch (error) {
            console.error('Error loading errors:', error);
            this.showNotification('Failed to load errors', 'error');
            return [];
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to load stats');
        } catch (error) {
            console.error('Error loading stats:', error);
            return null;
        }
    }

    async updateErrorStatus(errorId, status, notes = '') {
        try {
            const response = await fetch(`/api/errors/${errorId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, notes })
            });

            if (response.ok) {
                this.showNotification('Error status updated successfully', 'success');
                return true;
            }
            throw new Error('Failed to update error');
        } catch (error) {
            console.error('Error updating status:', error);
            this.showNotification('Failed to update error status', 'error');
            return false;
        }
    }

    async deleteError(errorId) {
        if (!await this.showConfirmation('Are you sure you want to delete this error report?')) {
            return false;
        }

        try {
            const response = await fetch(`/api/errors/${errorId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('Error report deleted successfully', 'success');
                return true;
            }
            throw new Error('Failed to delete error');
        } catch (error) {
            console.error('Error deleting error:', error);
            this.showNotification('Failed to delete error report', 'error');
            return false;
        }
    }

    async initSampleData() {
        try {
            const response = await fetch('/api/init-sample-data', {
                method: 'POST'
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification(`✅ ${result.message} (${result.count} errors added)`, 'success');
                return true;
            } else {
                this.showNotification(result.message || 'Data already exists', 'info');
                return false;
            }
        } catch (error) {
            console.error('Error initializing sample data:', error);
            this.showNotification('Failed to initialize sample data', 'error');
            return false;
        }
    }

    async clearAllData() {
        if (!await this.showConfirmation('⚠️ Are you sure you want to delete ALL error data? This action cannot be undone!')) {
            return false;
        }

        try {
            const response = await fetch('/api/errors', {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('✅ All data cleared successfully', 'success');
                return true;
            }
            throw new Error('Failed to clear data');
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showNotification('Failed to clear data', 'error');
            return false;
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="notification-close">&times;</button>
            </div>
        `;

        // Add styles if not already present
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    min-width: 300px;
                    max-width: 500px;
                    transform: translateX(400px);
                    opacity: 0;
                    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
                .notification.show {
                    transform: translateX(0);
                    opacity: 1;
                }
                .notification-content {
                    padding: 1rem;
                    border-radius: 4px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                .notification-info { background: #d1ecf1; color: #0c5460; border-left: 4px solid #17a2b8; }
                .notification-success { background: #d4edda; color: #155724; border-left: 4px solid #28a745; }
                .notification-error { background: #f8d7da; color: #721c24; border-left: 4px solid #dc3545; }
                .notification-warning { background: #fff3cd; color: #856404; border-left: 4px solid #ffc107; }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                    margin-left: 1rem;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    async showConfirmation(message) {
        return new Promise((resolve) => {
            const confirmed = confirm(message);
            resolve(confirmed);
        });
    }

    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p style="margin-top: 1rem;">Loading...</p>
                </div>
            `;
        }
    }

    hideLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            const loadingElement = container.querySelector('.loading');
            if (loadingElement) {
                loadingElement.remove();
            }
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    setupGlobalEventListeners() {
        // Add loading states to forms
        document.addEventListener('submit', (e) => {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px;"></div> Processing...';
                
                // Revert after 10 seconds if something goes wrong
                setTimeout(() => {
                    if (submitBtn.disabled) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                    }
                }, 10000);
            }
        });
    }
}

// Initialize app
const app = new CraneErrorApp();

// Global utility functions
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear any stored data
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to login page or home page
        window.location.href = 'index.html';
    }
}

function showNotification(message, type = 'info') {
    // Use the app's notification system if available
    if (app && typeof app.showNotification === 'function') {
        app.showNotification(message, type);
    } else {
        // Fallback notification system
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Make functions globally available
window.showNotification = showNotification;
window.logout = logout;
window.updateErrorStatus = (errorId, status) => app.updateErrorStatus(errorId, status);
window.deleteErrorReport = (errorId) => app.deleteError(errorId);
window.initSampleData = () => app.initSampleData();
window.clearAllData = () => app.clearAllData();

// Page-specific functionality
document.addEventListener('DOMContentLoaded', () => {
    // Set active navigation link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Initialize page-specific functionality
    if (window.location.pathname.includes('dashboard.html')) {
        initializeDashboard();
    } else if (window.location.pathname.includes('reports.html')) {
        initializeReports();
    } else if (window.location.pathname.includes('manual-entry.html')) {
        initializeManualEntry();
    } else if (window.location.pathname.includes('qr-scanner.html')) {
        initializeQRScanner();
    } else if (window.location.pathname.includes('error-codes.html')) {
        // Error codes page has its own initialization via error-codes.js
        console.log('Error codes page loaded - error-codes.js will handle initialization');
    }
});

// Dashboard functionality
async function initializeDashboard() {
    const [stats, errors] = await Promise.all([
        app.loadStats(),
        app.loadErrors()
    ]);

    if (stats) {
        updateDashboardStats(stats);
    }

    displayRecentErrors(errors);
}

function updateDashboardStats(stats) {
    const statsElements = {
        totalErrors: stats.totalErrors,
        openErrors: stats.openErrors,
        inProgressErrors: stats.inProgressErrors,
        resolvedErrors: stats.resolvedErrors
    };

    Object.entries(statsElements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function displayRecentErrors(errors) {
    const container = document.getElementById('recentErrors');
    if (!container) return;

    const recentErrors = errors.slice(0, 5);
    
    if (recentErrors.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No errors reported yet.</p>
                <a href="manual-entry.html" class="btn btn-primary mt-2">Report First Error</a>
            </div>
        `;
        return;
    }

    container.innerHTML = recentErrors.map(error => `
        <div class="error-item">
            <div class="error-details">
                <h4>${error.craneId} - ${error.errorType}</h4>
                <p>${error.description}</p>
                <div class="error-meta">
                    <span class="badge badge-${error.severity.toLowerCase()}">${error.severity}</span>
                    <span class="badge badge-${error.status === 'Resolved' ? 'success' : error.status === 'In Progress' ? 'warning' : 'danger'}">${error.status}</span>
                    <span>${app.formatDate(error.timestamp)}</span>
                </div>
            </div>
            <div class="error-actions">
                ${error.status !== 'In Progress' ? `<button onclick="updateErrorStatus('${error._id}', 'In Progress')" class="btn btn-warning btn-sm">In Progress</button>` : ''}
                ${error.status !== 'Resolved' ? `<button onclick="updateErrorStatus('${error._id}', 'Resolved')" class="btn btn-success btn-sm">Resolve</button>` : ''}
            </div>
        </div>
    `).join('');
}

// Reports functionality
async function initializeReports() {
    await loadReportsWithFilters();
    setupReportsFilters();
}

async function loadReportsWithFilters(filters = {}) {
    app.showLoading('reportsContent');
    const errors = await app.loadErrors();
    displayAllErrors(errors);
    app.hideLoading('reportsContent');
}

function setupReportsFilters() {
    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyFilters();
        });
    }

    const clearFilters = document.getElementById('clearFilters');
    if (clearFilters) {
        clearFilters.addEventListener('click', () => {
            document.querySelectorAll('#filterForm select').forEach(select => {
                select.value = '';
            });
            applyFilters();
        });
    }
}

async function applyFilters() {
    const status = document.getElementById('statusFilter')?.value;
    const severity = document.getElementById('severityFilter')?.value;
    
    const filters = {};
    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    
    await loadReportsWithFilters(filters);
}

function displayAllErrors(errors) {
    const container = document.getElementById('allErrors');
    if (!container) return;

    // Apply simple client-side filtering
    const statusFilter = document.getElementById('statusFilter')?.value;
    const severityFilter = document.getElementById('severityFilter')?.value;
    
    let filteredErrors = errors;
    if (statusFilter) {
        filteredErrors = filteredErrors.filter(error => error.status === statusFilter);
    }
    if (severityFilter) {
        filteredErrors = filteredErrors.filter(error => error.severity === severityFilter);
    }

    if (filteredErrors.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No errors found matching your criteria.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredErrors.map(error => `
        <div class="error-item">
            <div class="error-details">
                <h4>${error.craneId} - ${error.errorType}</h4>
                <p>${error.description}</p>
                <div class="error-meta">
                    <span><strong>Location:</strong> ${error.location || 'N/A'}</span>
                    <span><strong>Reported by:</strong> ${error.reportedBy}</span>
                    <span><strong>Date:</strong> ${app.formatDate(error.timestamp)}</span>
                    <span class="badge badge-${error.severity.toLowerCase()}">${error.severity}</span>
                    <span class="badge badge-${error.status === 'Resolved' ? 'success' : error.status === 'In Progress' ? 'warning' : 'danger'}">${error.status}</span>
                </div>
                ${error.notes ? `<p><strong>Notes:</strong> ${error.notes}</p>` : ''}
            </div>
            <div class="error-actions">
                ${error.status !== 'In Progress' ? `<button onclick="updateErrorStatus('${error._id}', 'In Progress')" class="btn btn-warning btn-sm">In Progress</button>` : ''}
                ${error.status !== 'Resolved' ? `<button onclick="updateErrorStatus('${error._id}', 'Resolved')" class="btn btn-success btn-sm">Resolve</button>` : ''}
                <button onclick="deleteErrorReport('${error._id}')" class="btn btn-danger btn-sm">Delete</button>
            </div>
        </div>
    `).join('');
}

// Manual Entry functionality
function initializeManualEntry() {
    const form = document.getElementById('errorForm');
    if (form) {
        form.addEventListener('submit', handleErrorSubmit);
        
        // Check for prefilled error code
        const prefilledCode = localStorage.getItem('prefilledErrorCode');
        if (prefilledCode) {
            document.getElementById('craneId').value = prefilledCode;
            localStorage.removeItem('prefilledErrorCode');
        }
    }
}

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
            app.showNotification('Error reported successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            throw new Error('Failed to submit error report');
        }
    } catch (error) {
        console.error('Error submitting report:', error);
        app.showNotification('Failed to submit error report. Please try again.', 'error');
    }
}

// QR Scanner functionality
function initializeQRScanner() {
    const video = document.getElementById('qr-video');
    const result = document.getElementById('qr-result');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();
                result.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <p>Camera started. Point at a QR code.</p>
                            <div class="scanner-frame">
                                <video id="qr-video" autoplay playsinline></video>
                            </div>
                        </div>
                    </div>
                `;
                
                // Simulate QR detection for demo
                setTimeout(simulateQRDetection, 3000);
            })
            .catch(function(error) {
                console.error('Camera error:', error);
                showCameraError(error);
            });
    } else {
        showCameraError(new Error('Camera not supported'));
    }
}

function simulateQRDetection() {
    const demoCraneId = 'CRN-' + Math.floor(1000 + Math.random() * 9000);
    const result = document.getElementById('qr-result');
    
    result.innerHTML = `
        <div class="card">
            <div class="card-body text-center">
                <div class="badge badge-success" style="margin-bottom: 1rem;">QR Code Detected!</div>
                <h4>Crane ID: ${demoCraneId}</h4>
                <p>Redirecting to manual entry...</p>
                <div class="spinner" style="margin: 1rem auto;"></div>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        window.location.href = `manual-entry.html?craneId=${demoCraneId}`;
    }, 2000);
}

function showCameraError(error) {
    const result = document.getElementById('qr-result');
    result.innerHTML = `
        <div class="card">
            <div class="card-body text-center">
                <div class="badge badge-danger" style="margin-bottom: 1rem;">Camera Error</div>
                <p>${error.message}</p>
                <p>Please use manual entry instead.</p>
                <a href="manual-entry.html" class="btn btn-primary">Manual Entry</a>
            </div>
        </div>
    `;
}
