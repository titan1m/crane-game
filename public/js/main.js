// Utility Functions
function showMessage(elementId, message, type = 'success') {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => {
        element.innerHTML = '';
    }, 5000);
}

function showLoading(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<div class="loading"></div> Loading...';
    button.disabled = true;
    return () => {
        button.innerHTML = originalText;
        button.disabled = false;
    };
}

// Authentication Functions
async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const button = document.querySelector('#loginForm button');
    const resetButton = showLoading(button);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            sessionStorage.setItem('userId', 'authenticated'); // In real app, you'd store actual user ID
            sessionStorage.setItem('username', username);
            window.location.href = 'dashboard.html';
        } else {
            showMessage('loginMessage', data.message, 'error');
        }
    } catch (error) {
        showMessage('loginMessage', 'Login failed. Please try again.', 'error');
    } finally {
        resetButton();
    }
}

async function signup() {
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const button = document.querySelector('#signupForm button');
    const resetButton = showLoading(button);

    if (password !== confirmPassword) {
        showMessage('signupMessage', 'Passwords do not match', 'error');
        resetButton();
        return;
    }

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('signupMessage', 'Account created successfully! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showMessage('signupMessage', data.message, 'error');
        }
    } catch (error) {
        showMessage('signupMessage', 'Signup failed. Please try again.', 'error');
    } finally {
        resetButton();
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        sessionStorage.clear();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
}

function isAuthenticated() {
    return sessionStorage.getItem('userId') !== null;
}

// Error Code Functions
async function quickSearch() {
    const code = document.getElementById('quickSearch').value.trim();
    if (!code) {
        showMessage('quickSearchResult', 'Please enter an error code', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/error-codes/${code}`);
        if (!response.ok) {
            throw new Error('Error code not found');
        }
        
        const errorCode = await response.json();
        displayErrorDetails('quickSearchResult', errorCode);
    } catch (error) {
        showMessage('quickSearchResult', 'Error code not found', 'error');
    }
}

async function searchErrorCodes() {
    const code = document.getElementById('searchCode') ? document.getElementById('searchCode').value.trim() : '';
    const category = document.getElementById('searchCategory') ? document.getElementById('searchCategory').value : 'All';
    
    const params = new URLSearchParams();
    if (code) params.append('code', code);
    if (category !== 'All') params.append('category', category);

    try {
        const response = await fetch(`/api/error-codes?${params}`);
        const errorCodes = await response.json();
        displaySearchResults(errorCodes);
    } catch (error) {
        console.error('Search error:', error);
        document.getElementById('searchResults').innerHTML = '<p>Error loading results</p>';
    }
}

function displaySearchResults(errorCodes) {
    const container = document.getElementById('searchResults');
    
    if (errorCodes.length === 0) {
        container.innerHTML = '<p>No error codes found matching your criteria.</p>';
        return;
    }

    container.innerHTML = errorCodes.map(error => `
        <div class="error-card ${error.severity.toLowerCase()}">
            <h3>${error.code} - ${error.description}</h3>
            <p><strong>Severity:</strong> ${error.severity}</p>
            <p><strong>Category:</strong> ${error.category}</p>
            <p><strong>Solution:</strong> ${error.solution}</p>
            ${window.location.pathname.includes('dashboard') ? `
                <button onclick="viewErrorDetails('${error.code}')" class="btn btn-primary">View Details</button>
            ` : ''}
        </div>
    `).join('');
}

function displayErrorDetails(containerId, errorCode) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="detail-card">
            <h3>${errorCode.code} - ${errorCode.description}</h3>
            <p><strong>Severity:</strong> <span class="severity-${errorCode.severity.toLowerCase()}">${errorCode.severity}</span></p>
            <p><strong>Category:</strong> ${errorCode.category}</p>
            <p><strong>Solution:</strong> ${errorCode.solution}</p>
        </div>
    `;
}

// Manual Entry Functions
async function searchManualCode() {
    const code = document.getElementById('errorCode').value.trim();
    if (!code) {
        showMessage('searchResult', 'Please enter an error code', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/error-codes/${code}`);
        if (!response.ok) {
            throw new Error('Error code not found');
        }
        
        const errorCode = await response.json();
        showErrorDetails(errorCode);
    } catch (error) {
        showMessage('searchResult', 'Error code not found', 'error');
        document.getElementById('errorDetails').style.display = 'none';
    }
}

function showErrorDetails(errorCode) {
    document.getElementById('detailCode').textContent = errorCode.code;
    document.getElementById('detailDescription').textContent = errorCode.description;
    document.getElementById('detailSeverity').textContent = errorCode.severity;
    document.getElementById('detailCategory').textContent = errorCode.category;
    document.getElementById('detailSolution').textContent = errorCode.solution;
    
    document.getElementById('errorDetails').style.display = 'block';
    document.getElementById('searchResult').innerHTML = '';
}

async function createReport() {
    const errorCode = document.getElementById('errorCode').value;
    const craneModel = document.getElementById('craneModel').value;
    const location = document.getElementById('location').value;
    const description = document.getElementById('description').value;

    if (!craneModel || !location) {
        showMessage('searchResult', 'Please fill in all required fields', 'error');
        return;
    }

    const button = document.querySelector('#reportForm button');
    const resetButton = showLoading(button);

    try {
        const response = await fetch('/api/reports', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                errorCode,
                craneModel,
                location,
                description
            })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('searchResult', 'Report created successfully!', 'success');
            document.getElementById('reportForm').reset();
            setTimeout(() => {
                window.location.href = 'reports.html';
            }, 2000);
        } else {
            showMessage('searchResult', 'Failed to create report', 'error');
        }
    } catch (error) {
        showMessage('searchResult', 'Error creating report', 'error');
    } finally {
        resetButton();
    }
}

// Reports Functions
async function loadReports() {
    try {
        const response = await fetch('/api/reports');
        const reports = await response.json();
        displayReports(reports);
    } catch (error) {
        console.error('Error loading reports:', error);
        document.getElementById('reportsContainer').innerHTML = '<p>Error loading reports</p>';
    }
}

function displayReports(reports) {
    const container = document.getElementById('reportsContainer');
    
    if (reports.length === 0) {
        container.innerHTML = '<p>No reports found.</p>';
        return;
    }

    container.innerHTML = reports.map(report => `
        <div class="report-item ${report.status.toLowerCase().replace(' ', '-')}">
            <h3>Report #${report._id.toString().substring(0, 8)}</h3>
            <p><strong>Error Code:</strong> ${report.errorCode}</p>
            <p><strong>Crane Model:</strong> ${report.craneModel}</p>
            <p><strong>Location:</strong> ${report.location}</p>
            <p><strong>Status:</strong> ${report.status}</p>
            <p><strong>Date:</strong> ${new Date(report.createdAt).toLocaleDateString()}</p>
            ${report.description ? `<p><strong>Notes:</strong> ${report.description}</p>` : ''}
        </div>
    `).join('');
}

// Dashboard Functions
async function loadDashboardStats() {
    try {
        // Load total error codes
        const errorResponse = await fetch('/api/error-codes');
        const errorCodes = await errorResponse.json();
        document.getElementById('totalErrors').textContent = errorCodes.length;

        // Load user reports
        const reportsResponse = await fetch('/api/reports');
        const reports = await reportsResponse.json();
        document.getElementById('userReports').textContent = reports.length;
        
        // Calculate open issues
        const openIssues = reports.filter(r => r.status !== 'Resolved').length;
        document.getElementById('openIssues').textContent = openIssues;
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Utility Functions for Settings
function clearUserData() {
    if (confirm('Are you sure you want to clear all local data?')) {
        sessionStorage.clear();
        localStorage.clear();
        alert('Local data cleared successfully.');
    }
}

function exportUserData() {
    alert('Export functionality would be implemented here.');
}

// Recent Errors and Suggestions
async function loadRecentErrors() {
    try {
        const response = await fetch('/api/error-codes?limit=5');
        const errorCodes = await response.json();
        displayRecentErrors(errorCodes);
    } catch (error) {
        console.error('Error loading recent errors:', error);
    }
}

function displayRecentErrors(errorCodes) {
    const container = document.getElementById('recentErrors');
    if (errorCodes.length === 0) return;

    container.innerHTML = errorCodes.map(error => `
        <div class="error-card">
            <h4>${error.code}</h4>
            <p>${error.description}</p>
            <button onclick="window.location.href='manual-entry.html?code=${error.code}'" class="btn btn-primary">
                View Details
            </button>
        </div>
    `).join('');
}

async function loadSuggestedCodes() {
    try {
        const response = await fetch('/api/error-codes');
        const errorCodes = await response.json();
        displaySuggestedCodes(errorCodes.slice(0, 6)); // Show first 6 as suggestions
    } catch (error) {
        console.error('Error loading suggested codes:', error);
    }
}

function displaySuggestedCodes(errorCodes) {
    const container = document.getElementById('suggestedCodes');
    if (errorCodes.length === 0) return;

    container.innerHTML = errorCodes.map(error => `
        <div class="code-card" onclick="document.getElementById('errorCode').value='${error.code}'; searchManualCode()">
            <h4>${error.code}</h4>
            <p>${error.description}</p>
            <span class="severity-badge ${error.severity.toLowerCase()}">${error.severity}</span>
        </div>
    `).join('');
}

// View Error Details (for dashboard)
function viewErrorDetails(code) {
    window.location.href = `manual-entry.html?code=${code}`;
}

// Initialize page based on authentication
document.addEventListener('DOMContentLoaded', function() {
    // Add severity badge styles
    const style = document.createElement('style');
    style.textContent = `
        .severity-high { color: #e74c3c; font-weight: bold; }
        .severity-medium { color: #f39c12; font-weight: bold; }
        .severity-low { color: #27ae60; font-weight: bold; }
        .severity-critical { color: #8e44ad; font-weight: bold; }
        .severity-badge {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            color: white;
        }
        .severity-badge.high { background: #e74c3c; }
        .severity-badge.medium { background: #f39c12; }
        .severity-badge.low { background: #27ae60; }
        .severity-badge.critical { background: #8e44ad; }
    `;
    document.head.appendChild(style);
});
