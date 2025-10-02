// Error Code Database functionality
class ErrorCodeManager {
    constructor() {
        this.currentResults = [];
        this.init();
    }

    async init() {
        // Load all error codes on page load
        await this.searchErrorCodes();
        
        // Add event listeners
        this.addEventListeners();
    }

    addEventListeners() {
        // Enter key support for search
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchErrorCodes();
            }
        });

        // Real-time search with debounce
        let searchTimeout;
        document.getElementById('searchInput').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchErrorCodes();
            }, 500);
        });

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('errorCodeModal');
            if (event.target === modal) {
                this.closeModal();
            }
        });
    }

    async searchErrorCodes() {
        const searchTerm = document.getElementById('searchInput').value;
        const errorType = document.getElementById('errorTypeFilter').value;
        const severity = document.getElementById('severityFilter').value;
        
        // Show loading state
        this.showLoading();

        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (errorType) params.append('errorType', errorType);
            if (severity) params.append('severity', severity);

            console.log('Searching with params:', params.toString());

            const response = await fetch(`/api/error-codes?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.currentResults = await response.json();
            this.displaySearchResults();
            
        } catch (error) {
            console.error('Search error:', error);
            this.showMessage('❌ Search failed: ' + error.message, 'error');
            this.displayErrorState();
        }
    }

    showLoading() {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Searching error codes...</p>
            </div>
        `;
    }

    displaySearchResults() {
        const resultsContainer = document.getElementById('searchResults');
        const resultsCount = document.getElementById('resultsCount');
        
        // Update results count
        resultsCount.textContent = `(${this.currentResults.length} found)`;

        if (this.currentResults.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <p>🔍 No error codes found matching your search criteria</p>
                    <button onclick="initErrorCodeDatabase()" class="btn btn-primary">
                        Load Sample Error Codes
                    </button>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = this.currentResults.map(errorCode => `
            <div class="error-code-card" onclick="errorCodeManager.showErrorCodeDetails('${errorCode.errorCode}')">
                <div class="error-code-header">
                    <span class="error-code-badge ${this.getSeverityClass(errorCode.severity)}">${errorCode.errorCode}</span>
                    <span class="error-type">${errorCode.errorType}</span>
                    <span class="severity-badge ${this.getSeverityClass(errorCode.severity)}">${errorCode.severity}</span>
                </div>
                <div class="error-code-body">
                    <h4>${errorCode.description}</h4>
                    <p class="symptoms-preview">${errorCode.symptoms.slice(0, 2).join(', ')}...</p>
                    <div class="error-code-meta">
                        <span>⏱️ ${errorCode.estimatedFixTime}h fix</span>
                        <span>🛠️ ${errorCode.requiredTools.length} tools</span>
                        <span>🏗️ ${errorCode.commonAffectedModels.length} models</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayErrorState() {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = `
            <div class="error-state">
                <p>❌ Unable to load error codes. Please check:</p>
                <ul>
                    <li>Are you connected to the internet?</li>
                    <li>Is the server running?</li>
                    <li>Have error codes been initialized?</li>
                </ul>
                <button onclick="errorCodeManager.initErrorCodeDatabase()" class="btn btn-success">
                    Initialize Error Codes Database
                </button>
            </div>
        `;
    }

    getSeverityClass(severity) {
        const severityMap = {
            'Critical': 'critical',
            'High': 'high', 
            'Medium': 'medium',
            'Low': 'low'
        };
        return severityMap[severity] || 'medium';
    }

    async showErrorCodeDetails(errorCode) {
        try {
            console.log('Loading error code details for:', errorCode);
            const response = await fetch(`/api/error-codes/${errorCode}`);
            
            if (!response.ok) {
                throw new Error('Error code not found');
            }
            
            const errorCodeData = await response.json();
            this.displayErrorCodeModal(errorCodeData);
            
        } catch (error) {
            console.error('Error loading details:', error);
            this.showMessage('❌ Error code details not found: ' + error.message, 'error');
        }
    }

    displayErrorCodeModal(errorCode) {
        // Create modal if it doesn't exist
        if (!document.getElementById('errorCodeModal')) {
            this.createModal();
        }

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
                        <strong>Severity:</strong> <span class="severity-badge ${this.getSeverityClass(errorCode.severity)}">${errorCode.severity}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Fix Time:</strong> ${errorCode.estimatedFixTime} hours
                    </div>
                    <div class="detail-item">
                        <strong>Affected Models:</strong> ${errorCode.commonAffectedModels.join(', ') || 'Various'}
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

                <div class="action-buttons">
                    <button onclick="errorCodeManager.reportThisError('${errorCode.errorCode}')" class="btn btn-primary">
                        📝 Report This Error
                    </button>
                    <button onclick="errorCodeManager.closeModal()" class="btn btn-secondary">
                        Close
                    </button>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    createModal() {
        const modalHTML = `
            <div id="errorCodeModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modalTitle">Error Code Details</h3>
                        <span class="close" onclick="errorCodeManager.closeModal()">&times;</span>
                    </div>
                    <div class="modal-body" id="modalBody">
                        Loading...
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeModal() {
        const modal = document.getElementById('errorCodeModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async initErrorCodeDatabase() {
        try {
            this.showMessage('⏳ Loading sample error codes...', 'info');
            
            const response = await fetch('/api/error-codes/init', { 
                method: 'POST' 
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showMessage(`✅ Loaded ${result.count} error codes successfully!`, 'success');
                // Refresh search results
                await this.searchErrorCodes();
            } else {
                this.showMessage(result.message || 'Database already initialized', 'info');
            }
        } catch (error) {
            console.error('Init error:', error);
            this.showMessage('❌ Failed to initialize database: ' + error.message, 'error');
        }
    }

    reportThisError(errorCode) {
        // Store error code for pre-filling the report form
        localStorage.setItem('prefilledErrorCode', errorCode);
        this.showMessage('📝 Redirecting to error report form...', 'success');
        
        setTimeout(() => {
            window.location.href = 'manual-entry.html';
        }, 1000);
    }

    showMessage(message, type = 'info') {
        // Use existing notification system or create simple alert
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, type);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem;
                background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
                color: white;
                border-radius: 5px;
                z-index: 1000;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 3000);
        }
    }
}

// Global functions
const errorCodeManager = new ErrorCodeManager();

// Simplified global functions that use the class instance
function searchErrorCodes() {
    errorCodeManager.searchErrorCodes();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('errorTypeFilter').value = '';
    document.getElementById('severityFilter').value = '';
    errorCodeManager.searchErrorCodes();
}

function loadErrorCode(code) {
    document.getElementById('searchInput').value = code;
    errorCodeManager.searchErrorCodes();
}

function initErrorCodeDatabase() {
    errorCodeManager.initErrorCodeDatabase();
}

// Make functions globally available
window.searchErrorCodes = searchErrorCodes;
window.clearSearch = clearSearch;
window.loadErrorCode = loadErrorCode;
window.initErrorCodeDatabase = initErrorCodeDatabase;
