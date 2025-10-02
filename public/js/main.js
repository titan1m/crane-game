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
            }
            return false;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
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

    async loadErrors(filters = {}) {
        try {
            const queryString = new URLSearchParams(filters).toString();
            const response = await fetch(`/api/errors?${queryString}`);
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
        if (!confirm('Are you sure you want to delete this error report?')) {
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

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            background-color: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
}

const app = new CraneErrorApp();

// Global authentication check
async function checkAuth() {
    const isAuthenticated = await app.checkAuthentication();
    
    if (!isAuthenticated && 
        !window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('signup.html')) {
        window.location.href = 'login.html';
        return false;
    }
    
    if (isAuthenticated && 
        (window.location.pathname.includes('login.html') || 
         window.location.pathname.includes('signup.html'))) {
        window.location.href = 'dashboard.html';
        return false;
    }
    
    return isAuthenticated;
}

// Dashboard functionality
if (window.location.pathname.includes('dashboard.html')) {
    document.addEventListener('DOMContentLoaded', async function() {
        if (!await checkAuth()) return;
        
        await loadDashboard();
        setupEventListeners();
    });

    async function loadDashboard() {
        showLoading('dashboardContent');
        
        const [stats, errors] = await Promise.all([
            app.loadStats(),
            app.loadErrors()
        ]);

        if (stats) {
            updateStats(stats);
        }

        displayRecentErrors(errors);
        hideLoading('dashboardContent');
    }

    function updateStats(stats) {
        document.getElementById('totalErrors').textContent = stats.totalErrors;
        document.getElementById('openErrors').textContent = stats.openErrors;
        document.getElementById('inProgressErrors').textContent = stats.inProgressErrors;
        document.getElementById('resolvedErrors').textContent = stats.resolvedErrors;
    }

    function displayRecentErrors(errors) {
        const errorList = document.getElementById('recentErrors');
        const recentErrors = errors.slice(0, 5);

        if (recentErrors.length === 0) {
            errorList.innerHTML = '<div class="error-item"><p>No errors reported yet.</p></div>';
            return;
        }

        errorList.innerHTML = recentErrors.map(error => `
            <div class="error-item">
                <div class="error-details">
                    <strong>${error.craneId}</strong> - ${error.errorType}
                    <br>
                    <small>Reported by ${error.reportedBy} on ${app.formatDate(error.timestamp)}</small>
                    <br>
                    <span class="error-severity severity-${error.severity.toLowerCase()}">
                        ${error.severity}
                    </span>
                    <span class="error-status status-${error.status.toLowerCase().replace(' ', '-')}">
                        ${error.status}
                    </span>
                </div>
                <div class="error-actions">
                    <button onclick="updateError('${error._id}', 'In Progress')" class="btn btn-warning btn-sm">In Progress</button>
                    <button onclick="updateError('${error._id}', 'Resolved')" class="btn btn-success btn-sm">Resolve</button>
                </div>
            </div>
        `).join('');
    }

    function setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
    }

    window.updateError = async function(errorId, status) {
        const notes = prompt('Enter notes (optional):');
        if (notes !== null) {
            const success = await app.updateErrorStatus(errorId, status, notes);
            if (success) {
                await loadDashboard();
            }
        }
    };
}

// Reports functionality
if (window.location.pathname.includes('reports.html')) {
    document.addEventListener('DOMContentLoaded', async function() {
        if (!await checkAuth()) return;
        
        await loadReports();
        setupReportsFilters();
    });

    async function loadReports(filters = {}) {
        showLoading('reportsContent');
        const errors = await app.loadErrors(filters);
        displayAllErrors(errors);
        hideLoading('reportsContent');
    }

    function displayAllErrors(errors) {
        const errorList = document.getElementById('allErrors');
        
        if (errors.length === 0) {
            errorList.innerHTML = '<div class="error-item"><p>No errors found matching the criteria.</p></div>';
            return;
        }

        errorList.innerHTML = errors.map(error => `
            <div class="error-item">
                <div class="error-details">
                    <strong>Crane ID:</strong> ${error.craneId}<br>
                    <strong>Error Type:</strong> ${error.errorType}<br>
                    <strong>Description:</strong> ${error.description}<br>
                    <strong>Reported by:</strong> ${error.reportedBy} on ${app.formatDate(error.timestamp)}<br>
                    <strong>Location:</strong> ${error.location || 'N/A'}<br>
                    <span class="error-severity severity-${error.severity.toLowerCase()}">
                        ${error.severity}
                    </span>
                    <span class="error-status status-${error.status.toLowerCase().replace(' ', '-')}">
                        ${error.status}
                    </span>
                    ${error.notes ? `<br><strong>Notes:</strong> ${error.notes}` : ''}
                    ${error.resolvedAt ? `<br><strong>Resolved:</strong> ${app.formatDate(error.resolvedAt)}` : ''}
                </div>
                <div class="error-actions">
                    <button onclick="updateErrorStatus('${error._id}', 'In Progress')" class="btn btn-warning btn-sm">In Progress</button>
                    <button onclick="updateErrorStatus('${error._id}', 'Resolved')" class="btn btn-success btn-sm">Resolve</button>
                    <button onclick="deleteErrorReport('${error._id}')" class="btn btn-danger btn-sm">Delete</button>
                </div>
            </div>
        `).join('');
    }

    function setupReportsFilters() {
        const filterForm = document.getElementById('filterForm');
        const statusFilter = document.getElementById('statusFilter');
        const severityFilter = document.getElementById('severityFilter');
        const clearFilters = document.getElementById('clearFilters');

        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            applyFilters();
        });

        statusFilter.addEventListener('change', applyFilters);
        severityFilter.addEventListener('change', applyFilters);

        clearFilters.addEventListener('click', function() {
            statusFilter.value = '';
            severityFilter.value = '';
            applyFilters();
        });
    }

    async function applyFilters() {
        const status = document.getElementById('statusFilter').value;
        const severity = document.getElementById('severityFilter').value;
        
        const filters = {};
        if (status) filters.status = status;
        if (severity) filters.severity = severity;
        
        await loadReports(filters);
    }

    window.updateErrorStatus = async function(errorId, status) {
        const notes = prompt('Enter notes (optional):');
        if (notes !== null) {
            const success = await app.updateErrorStatus(errorId, status, notes);
            if (success) {
                await loadReports();
            }
        }
    };

    window.deleteErrorReport = async function(errorId) {
        const success = await app.deleteError(errorId);
        if (success) {
            await loadReports();
        }
    };
}

// Error reporting functionality
if (window.location.pathname.includes('manual-entry.html')) {
    document.addEventListener('DOMContentLoaded', async function() {
        if (!await checkAuth()) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const craneId = urlParams.get('craneId');
        if (craneId) {
            document.getElementById('craneId').value = craneId;
        }
        
        setupErrorForm();
    });

    function setupErrorForm() {
        const errorForm = document.getElementById('errorForm');
        errorForm.addEventListener('submit', handleErrorSubmit);
    }

    async function handleErrorSubmit(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        
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
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Report Error';
        }
    }
}

// QR Scanner functionality
if (window.location.pathname.includes('qr-scanner.html')) {
    document.addEventListener('DOMContentLoaded', async function() {
        if (!await checkAuth()) return;
        initializeQRScanner();
    });

    function initializeQRScanner() {
        const video = document.getElementById('qr-video');
        const result = document.getElementById('qr-result');

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(function(stream) {
                    video.srcObject = stream;
                    video.play();
                    result.textContent = 'Camera started. Point at a QR code.';
                    
                    // Simulate QR code detection for demo
                    setTimeout(() => {
                        const demoCraneId = 'CRN-' + Math.floor(1000 + Math.random() * 9000);
                        result.innerHTML = `QR Code detected!<br>Crane ID: ${demoCraneId}<br>Redirecting to manual entry...`;
                        setTimeout(() => {
                            window.location.href = `manual-entry.html?craneId=${demoCraneId}`;
                        }, 2000);
                    }, 3000);
                })
                .catch(function(error) {
                    console.error('Camera error:', error);
                    result.innerHTML = `
                        <p>Cannot access camera: ${error.message}</p>
                        <p>Please try manual entry instead.</p>
                        <a href="manual-entry.html" class="btn btn-primary">Manual Entry</a>
                    `;
                });
        } else {
            result.innerHTML = `
                <p>Camera access not supported by this browser.</p>
                <p>Please try manual entry instead.</p>
                <a href="manual-entry.html" class="btn btn-primary">Manual Entry</a>
            `;
        }
    }
}

// Settings functionality
if (window.location.pathname.includes('settings.html')) {
    document.addEventListener('DOMContentLoaded', async function() {
        if (!await checkAuth()) return;
        loadUserInfo();
    });

    function loadUserInfo() {
        if (app.currentUser) {
            document.getElementById('userInfo').innerHTML = `
                <p><strong>Username:</strong> ${app.currentUser.username}</p>
                <p><strong>Logged in since:</strong> ${new Date().toLocaleString()}</p>
            `;
        }
    }
}

// Utility functions
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading">Loading...</div>';
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element && element.innerHTML.includes('Loading...')) {
        element.innerHTML = '';
    }
}

// Global logout function
window.logout = function() {
    app.logout();
};

// Initialize app on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add logout functionality to all logout buttons
    const logoutButtons = document.querySelectorAll('[id*="logout"], .logout-btn');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', window.logout);
    });
});
