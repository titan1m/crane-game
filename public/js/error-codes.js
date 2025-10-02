// Error Code Database functionality
class ErrorCodeManager {
    constructor() {
        this.currentResults = [];
        this.init();
    }

    async init() {
        // Load all error codes on page load
        await this.searchErrorCodes();
        this.addEventListeners();
    }

    addEventListeners() {
        // Enter key support for search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchErrorCodes();
                }
            });

            // Real-time search with debounce
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchErrorCodes();
                }, 500);
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('errorCodeModal');
            if (event.target === modal) {
                this.closeModal();
            }
        });
    }

    async searchErrorCodes() {
        const searchTerm = document.getElementById('searchInput')?.value || '';
        const errorType = document.getElementById('errorTypeFilter')?.value || '';
        const severity = document.getElementById('severityFilter')?.value || '';
        
        this.showLoading();

        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (searchTerm) params.append('q', searchTerm); // Changed from 'search' to 'q'
            if (errorType) params.append('type', errorType); // Changed from 'errorType' to 'type'
            if (severity) params.append('severity', severity);

            const response = await fetch(`/api/error-codes?${params}`);
            
            if (!response.ok) {
                // If no error codes found, return empty array instead of throwing
                if (response.status === 404) {
                    this.currentResults = [];
                    this.displaySearchResults();
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.currentResults = data.errorCodes || data || []; // Handle different response formats
            this.displaySearchResults();
            
        } catch (error) {
            console.error('Search error:', error);
            this.showMessage('❌ Search failed. Please check if error codes are initialized.', 'error');
            this.currentResults = [];
            this.displaySearchResults();
        }
    }

    showLoading() {
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Searching error codes...</p>
                </div>
            `;
        }
    }

    displaySearchResults() {
        const resultsContainer = document.getElementById('searchResults');
        const resultsCount = document.getElementById('resultsCount');
        
        if (!resultsContainer) return;

        // Update results count
        if (resultsCount) {
            resultsCount.textContent = `(${this.currentResults.length} found)`;
        }

        if (this.currentResults.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <p>🔍 No error codes found matching your search criteria</p>
                    <button onclick="errorCodeManager.initErrorCodeDatabase()" class="btn btn-primary mt-2">
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
                    <p class="symptoms-preview">${errorCode.symptoms ? errorCode.symptoms.slice(0, 2).join(', ') : 'No symptoms listed'}...</p>
                    <div class="error-code-meta">
                        <span>⏱️ ${errorCode.estimatedFixTime || 'Unknown'}h fix</span>
                        <span>🛠️ ${errorCode.requiredTools ? errorCode.requiredTools.length : 0} tools</span>
                        <span>🏗️ ${errorCode.commonAffectedModels ? errorCode.commonAffectedModels.length : 0} models</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayErrorState() {
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="error-state">
                    <p>❌ Unable to load error codes. Please check:</p>
                    <ul>
                        <li>Are you connected to the internet?</li>
                        <li>Is the server running?</li>
                        <li>Have error codes been initialized?</li>
                    </ul>
                    <button onclick="errorCodeManager.initErrorCodeDatabase()" class="btn btn-success mt-2">
                        Initialize Error Codes Database
                    </button>
                </div>
            `;
        }
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
            const response = await fetch(`/api/error-codes/${errorCode}`);
            
            if (!response.ok) {
                throw new Error('Error code not found');
            }
            
            const errorCodeData = await response.json();
            this.displayErrorCodeModal(errorCodeData);
            
        } catch (error) {
            console.error('Error loading details:', error);
            this.showMessage('❌ Error code details not found', 'error');
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

        if (modalTitle) modalTitle.textContent = `Error Code: ${errorCode.errorCode}`;
        
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="error-code-details">
                    <div class="detail-section">
                        <h4>📋 Description</h4>
                        <p>${errorCode.description || 'No description available'}</p>
                    </div>

                    <div class="detail-grid">
                        <div class="detail-item">
                            <strong>Type:</strong> ${errorCode.errorType || 'Unknown'}
                        </div>
                        <div class="detail-item">
                            <strong>Severity:</strong> <span class="severity-badge ${this.getSeverityClass(errorCode.severity)}">${errorCode.severity || 'Unknown'}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Fix Time:</strong> ${errorCode.estimatedFixTime || 'Unknown'} hours
                        </div>
                        <div class="detail-item">
                            <strong>Affected Models:</strong> ${errorCode.commonAffectedModels ? errorCode.commonAffectedModels.join(', ') : 'Various'}
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>🚨 Symptoms</h4>
                        <ul>
                            ${errorCode.symptoms ? errorCode.symptoms.map(symptom => `<li>${symptom}</li>`).join('') : '<li>No symptoms listed</li>'}
                        </ul>
                    </div>

                    <div class="detail-section">
                        <h4>🔍 Possible Causes</h4>
                        <ul>
                            ${errorCode.causes ? errorCode.causes.map(cause => `<li>${cause}</li>`).join('') : '<li>No causes listed</li>'}
                        </ul>
                    </div>

                    <div class="detail-section">
                        <h4>🛠️ Solutions</h4>
                        <ol>
                            ${errorCode.solutions ? errorCode.solutions.map(solution => `<li>${solution}</li>`).join('') : '<li>No solutions listed</li>'}
                        </ol>
                    </div>

                    <div class="detail-section">
                        <h4>⚡ Immediate Actions</h4>
                        <ul class="urgent-list">
                            ${errorCode.immediateActions ? errorCode.immediateActions.map(action => `<li>${action}</li>`).join('') : '<li>No immediate actions listed</li>'}
                        </ul>
                    </div>

                    <div class="detail-section">
                        <h4>🛡️ Safety Precautions</h4>
                        <ul class="safety-list">
                            ${errorCode.safetyPrecautions ? errorCode.safetyPrecautions.map(precaution => `<li>${precaution}</li>`).join('') : '<li>No safety precautions listed</li>'}
                        </ul>
                    </div>

                    <div class="detail-section">
                        <h4>🔧 Required Tools</h4>
                        <div class="tools-list">
                            ${errorCode.requiredTools ? errorCode.requiredTools.map(tool => `<span class="tool-tag">${tool}</span>`).join('') : '<span class="tool-tag">No specific tools listed</span>'}
                        </div>
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
        }

        if (modal) modal.style.display = 'block';
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
            this.showMessage('❌ Failed to initialize database', 'error');
        }
    }

    reportThisError(errorCode) {
        // Store error code for pre-filling the report form
        localStorage.setItem('prefilledErrorCode', errorCode);
        this.showMessage('📝 Redirecting to error report form...', 'success');
        this.closeModal();
        
        setTimeout(() => {
            window.location.href = 'manual-entry.html';
        }, 1000);
    }

    showMessage(message, type = 'info') {
        // Use existing notification system or create simple alert
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, type);
        } else if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            // Fallback notification
            alert(message);
        }
    }
}

// Global functions
const errorCodeManager = new ErrorCodeManager();

// Global functions that use the class instance
function searchErrorCodes() {
    errorCodeManager.searchErrorCodes();
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const errorTypeFilter = document.getElementById('errorTypeFilter');
    const severityFilter = document.getElementById('severityFilter');
    
    if (searchInput) searchInput.value = '';
    if (errorTypeFilter) errorTypeFilter.value = '';
    if (severityFilter) severityFilter.value = '';
    
    errorCodeManager.searchErrorCodes();
}

function loadErrorCode(code) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = code;
    }
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
