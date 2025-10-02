// Error Code Database functionality
class ErrorCodeManager {
    constructor() {
        this.currentResults = [];
    }

    async searchErrorCodes(searchTerm = '', errorType = '', severity = '') {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (errorType) params.append('errorType', errorType);
        if (severity) params.append('severity', severity);

        try {
            const response = await fetch(`/api/error-codes?${params}`);
            if (response.ok) {
                this.currentResults = await response.json();
                this.displaySearchResults();
            } else {
                throw new Error('Search failed');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showMessage('❌ Search failed. Please try again.', 'error');
        }
    }

    displaySearchResults() {
        const resultsContainer = document.getElementById('searchResults');
        
        if (this.currentResults.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <p>🔍 No error codes found matching your search criteria</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = this.currentResults.map(errorCode => `
            <div class="error-code-card" onclick="showErrorCodeDetails('${errorCode.errorCode}')">
                <div class="error-code-header">
                    <span class="error-code-badge ${errorCode.severity.toLowerCase()}">${errorCode.errorCode}</span>
                    <span class="error-type">${errorCode.errorType}</span>
                    <span class="severity-badge ${errorCode.severity.toLowerCase()}">${errorCode.severity}</span>
                </div>
                <div class="error-code-body">
                    <h4>${errorCode.description}</h4>
                    <p class="symptoms-preview">${errorCode.symptoms.slice(0, 2).join(', ')}...</p>
                    <div class="error-code-meta">
                        <span>⏱️ ${errorCode.estimatedFixTime}h fix</span>
                        <span>🛠️ ${errorCode.requiredTools.length} tools</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async showErrorCodeDetails(errorCode) {
        try {
            const response = await fetch(`/api/error-codes/${errorCode}`);
            if (response.ok) {
                const errorCodeData = await response.json();
                this.displayErrorCodeModal(errorCodeData);
            } else {
                throw new Error('Error code not found');
            }
        } catch (error) {
            this.showMessage('❌ Error code details not found', 'error');
        }
    }

    displayErrorCodeModal(errorCode) {
        const modal = document.getElementById('errorCodeModal');
        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');

        modalTitle.textContent = `Error Code: ${errorCode.errorCode}`;
        
        modalBody.innerHTML = `
            <div class="error-code-details">
                <div class="detail-section">
                    <h4>📋 Description</h4>
                    <p>${errorCode.description}</p>
                </div>

                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Type:</strong> ${errorCode.errorType}
                    </div>
                    <div class="detail-item">
                        <strong>Severity:</strong> <span class="severity-badge ${errorCode.severity.toLowerCase()}">${errorCode.severity}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Fix Time:</strong> ${errorCode.estimatedFixTime} hours
                    </div>
                    <div class="detail-item">
                        <strong>Affected Models:</strong> ${errorCode.commonAffectedModels.join(', ')}
                    </div>
                </div>

                <div class="detail-section">
                    <h4>🚨 Symptoms</h4>
                    <ul>
                        ${errorCode.symptoms.map(symptom => `<li>${symptom}</li>`).join('')}
                    </ul>
                </div>

                <div class="detail-section">
                    <h4>🔍 Possible Causes</h4>
                    <ul>
                        ${errorCode.causes.map(cause => `<li>${cause}</li>`).join('')}
                    </ul>
                </div>

                <div class="detail-section">
                    <h4>🛠️ Solutions</h4>
                    <ol>
                        ${errorCode.solutions.map(solution => `<li>${solution}</li>`).join('')}
                    </ol>
                </div>

                <div class="detail-section">
                    <h4>⚡ Immediate Actions</h4>
                    <ul class="urgent-list">
                        ${errorCode.immediateActions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>

                <div class="detail-section">
                    <h4>🛡️ Safety Precautions</h4>
                    <ul class="safety-list">
                        ${errorCode.safetyPrecautions.map(precaution => `<li>${precaution}</li>`).join('')}
                    </ul>
                </div>

                <div class="detail-section">
                    <h4>🔧 Required Tools</h4>
                    <div class="tools-list">
                        ${errorCode.requiredTools.map(tool => `<span class="tool-tag">${tool}</span>`).join('')}
                    </div>
                </div>

                <div class="action-buttons">
                    <button onclick="reportThisError('${errorCode.errorCode}')" class="btn btn-primary">
                        📝 Report This Error
                    </button>
                    <button onclick="printErrorCode('${errorCode.errorCode}')" class="btn btn-secondary">
                        🖨️ Print Solution
                    </button>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    async initErrorCodeDatabase() {
        try {
            const response = await fetch('/api/error-codes/init', { method: 'POST' });
            const result = await response.json();
            
            if (response.ok) {
                this.showMessage(`✅ Loaded ${result.count} error codes successfully!`, 'success');
                this.searchErrorCodes(); // Refresh results
            } else {
                this.showMessage(result.message || 'Database already initialized', 'info');
            }
        } catch (error) {
            this.showMessage('❌ Failed to initialize database', 'error');
        }
    }

    showMessage(message, type = 'info') {
        // You can use your existing notification system
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Global functions
const errorCodeManager = new ErrorCodeManager();

function searchErrorCodes() {
    const searchTerm = document.getElementById('searchInput').value;
    const errorType = document.getElementById('errorTypeFilter').value;
    const severity = document.getElementById('severityFilter').value;
    
    errorCodeManager.searchErrorCodes(searchTerm, errorType, severity);
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('errorTypeFilter').value = '';
    document.getElementById('severityFilter').value = '';
    errorCodeManager.searchErrorCodes();
}

function loadErrorCode(code) {
    document.getElementById('searchInput').value = code;
    errorCodeManager.searchErrorCodes(code);
}

function closeModal() {
    document.getElementById('errorCodeModal').style.display = 'none';
}

function initErrorCodeDatabase() {
    errorCodeManager.initErrorCodeDatabase();
}

function viewAllErrorCodes() {
    errorCodeManager.searchErrorCodes();
}

function reportThisError(errorCode) {
    // Pre-fill the error report form with this error code
    localStorage.setItem('prefilledErrorCode', errorCode);
    window.location.href = 'manual-entry.html';
}

function printErrorCode(errorCode) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Error Code ${errorCode} - Solution</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; }
                    ul { line-height: 1.6; }
                    .urgent-list { color: #d63031; font-weight: bold; }
                    .safety-list { color: #0984e3; }
                </style>
            </head>
            <body>
                <h1>Error Code ${errorCode} - Solution Sheet</h1>
                <div id="content"></div>
                <script>
                    // Content would be loaded here
                    document.getElementById('content').innerHTML = 'Print functionality would show detailed solution here';
                </script>
            </body>
        </html>
    `);
    printWindow.print();
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Load all error codes on page load
    errorCodeManager.searchErrorCodes();
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('errorCodeModal');
        if (event.target === modal) {
            closeModal();
        }
    }
    
    // Enter key support for search
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchErrorCodes();
        }
    });
});
