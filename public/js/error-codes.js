// public/js/error-codes.js - Complete fixed version
class ErrorCodeManager {
    constructor() {
        this.errorCodes = [];
        this.init();
    }

    async init() {
        await this.loadErrorCodes();
        this.setupEventListeners();
        this.displayAllErrorCodes(); // Show all codes initially
    }

    async loadErrorCodes() {
        try {
            // Try to load from API first
            const response = await fetch('/api/error-codes');
            if (response.ok) {
                this.errorCodes = await response.json();
            } else {
                // Fallback to demo data
                this.loadDemoData();
            }
        } catch (error) {
            console.log('Using demo data:', error);
            this.loadDemoData();
        }
    }

    loadDemoData() {
        this.errorCodes = [
            {
                errorCode: "E001",
                errorType: "Hydraulic",
                severity: "High",
                description: "Hydraulic System Pressure Loss",
                symptoms: ["Slow boom movement", "Unable to lift rated loads", "Hydraulic fluid leakage"],
                causes: ["Hydraulic fluid leak", "Faulty pressure relief valve", "Worn pump seals"],
                solutions: ["Check and repair hydraulic lines", "Replace pressure relief valve", "Inspect pump seals"],
                immediateActions: ["Stop crane operation immediately", "Check hydraulic fluid level"],
                requiredTools: ["Pressure gauge", "Wrench set"],
                estimatedFixTime: 4,
                safetyPrecautions: ["Release hydraulic pressure before working", "Use proper PPE"],
                commonAffectedModels: ["LTM 1100", "GMK 3050", "AC 250"]
            },
            {
                errorCode: "E002",
                errorType: "Electrical",
                severity: "Critical", 
                description: "Emergency Stop Circuit Failure",
                symptoms: ["Emergency stop button not functioning", "Control panel error lights"],
                causes: ["Faulty emergency stop button", "Broken wiring", "Control relay failure"],
                solutions: ["Test and replace emergency stop button", "Check safety circuit wiring"],
                immediateActions: ["Use secondary shutdown procedures", "Disconnect main power"],
                requiredTools: ["Multimeter", "Wiring diagrams"],
                estimatedFixTime: 2,
                safetyPrecautions: ["Lock out/tag out power sources", "Test all safety systems"],
                commonAffectedModels: ["All models with electronic controls"]
            },
            {
                errorCode: "E003",
                errorType: "Mechanical",
                severity: "High",
                description: "Boom Extension Mechanism Failure",
                symptoms: ["Boom not extending properly", "Unusual noises during extension"],
                causes: ["Worn extension cables", "Damaged hydraulic cylinders", "Misaligned guides"],
                solutions: ["Inspect and replace extension cables", "Check hydraulic cylinders", "Realign boom guides"],
                immediateActions: ["Do not force boom extension", "Secure boom in current position"],
                requiredTools: ["Cable tension gauge", "Alignment tools"],
                estimatedFixTime: 6,
                safetyPrecautions: ["Secure boom properly", "Use fall protection"],
                commonAffectedModels: ["RT 540", "GR 800", "NK 500"]
            },
            {
                errorCode: "E004",
                errorType: "Safety",
                severity: "Critical",
                description: "Load Moment Indicator Malfunction",
                symptoms: ["LMI showing incorrect readings", "Warning alarms not functioning"],
                causes: ["Sensor calibration issues", "Wiring problems", "Software glitch"],
                solutions: ["Recalibrate LMI sensors", "Check sensor wiring", "Update LMI software"],
                immediateActions: ["Stop all lifting operations", "Use manual calculations"],
                requiredTools: ["Calibration kit", "Multimeter"],
                estimatedFixTime: 3,
                safetyPrecautions: ["Never bypass LMI system", "Verify with manual calculations"],
                commonAffectedModels: ["All modern crane models"]
            },
            {
                errorCode: "E005",
                errorType: "Hydraulic",
                severity: "Medium",
                description: "Cylinder Drift Issue",
                symptoms: ["Boom slowly lowers when stationary", "Fluid leakage around cylinders"],
                causes: ["Worn piston seals", "Faulty control valves", "Internal cylinder damage"],
                solutions: ["Replace piston seals", "Repair or replace control valves", "Inspect cylinder internals"],
                immediateActions: ["Monitor drift rate", "Do not leave loads suspended"],
                requiredTools: ["Seal kit", "Pressure test equipment"],
                estimatedFixTime: 5,
                safetyPrecautions: ["Block boom before working", "Release all pressure"],
                commonAffectedModels: ["ATF 220", "TCC 1200", "LTM 1500"]
            }
        ];
    }

    setupEventListeners() {
        // Search button
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.searchErrorCodes());
        }

        // Enter key in search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchErrorCodes();
                }
            });
        }

        // Filter changes
        const errorTypeFilter = document.getElementById('errorTypeFilter');
        const severityFilter = document.getElementById('severityFilter');
        
        if (errorTypeFilter) {
            errorTypeFilter.addEventListener('change', () => this.searchErrorCodes());
        }
        if (severityFilter) {
            severityFilter.addEventListener('change', () => this.searchErrorCodes());
        }

        // Clear search
        const clearBtn = document.getElementById('clearFilters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearSearch());
        }

        // Initialize database button
        const initBtn = document.querySelector('button[onclick="initErrorCodeDatabase()"]');
        if (initBtn) {
            initBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.initErrorCodeDatabase();
            });
        }

        // View all button
        const viewAllBtn = document.querySelector('button[onclick="viewAllErrorCodes()"]');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.displayAllErrorCodes();
            });
        }
    }

    searchErrorCodes() {
        const searchTerm = document.getElementById('searchInput').value.trim();
        const errorType = document.getElementById('errorTypeFilter').value;
        const severity = document.getElementById('severityFilter').value;

        let filteredCodes = this.errorCodes;

        // Filter by search term
        if (searchTerm) {
            filteredCodes = filteredCodes.filter(code => 
                code.errorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                code.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                code.symptoms.some(symptom => 
                    symptom.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        // Filter by error type
        if (errorType) {
            filteredCodes = filteredCodes.filter(code => code.errorType === errorType);
        }

        // Filter by severity
        if (severity) {
            filteredCodes = filteredCodes.filter(code => code.severity === severity);
        }

        this.displaySearchResults(filteredCodes);
    }

    displaySearchResults(results) {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <h4>🔍 No Error Codes Found</h4>
                    <p>No error codes match your search criteria. Try:</p>
                    <ul>
                        <li>Checking the error code spelling</li>
                        <li>Using different search terms</li>
                        <li>Clearing the filters</li>
                    </ul>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = results.map(code => `
            <div class="error-code-item" onclick="errorCodeManager.showErrorDetails('${code.errorCode}')">
                <div class="error-code-header">
                    <span class="code-badge ${code.severity.toLowerCase()}">${code.errorCode}</span>
                    <span class="error-type-tag">${code.errorType}</span>
                    <span class="severity-tag ${code.severity.toLowerCase()}">${code.severity}</span>
                </div>
                <div class="error-code-content">
                    <h4>${code.description}</h4>
                    <p><strong>Symptoms:</strong> ${code.symptoms.slice(0, 2).join(', ')}...</p>
                    <div class="error-code-meta">
                        <span>⏱️ ${code.estimatedFixTime}h estimated fix time</span>
                        <span>🛠️ ${code.requiredTools.length} tools required</span>
                    </div>
                </div>
                <div class="error-code-actions">
                    <button class="btn-view-details" onclick="event.stopPropagation(); errorCodeManager.showErrorDetails('${code.errorCode}')">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    displayAllErrorCodes() {
        this.displaySearchResults(this.errorCodes);
    }

    showErrorDetails(errorCode) {
        const code = this.errorCodes.find(ec => ec.errorCode === errorCode);
        if (!code) return;

        const modal = document.getElementById('errorCodeModal');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalBody) {
            alert(`Error Code: ${code.errorCode}\nDescription: ${code.description}`);
            return;
        }

        modalBody.innerHTML = `
            <div class="error-details">
                <div class="detail-section">
                    <div class="detail-header">
                        <h3>${code.errorCode} - ${code.description}</h3>
                        <div class="detail-tags">
                            <span class="tag-type">${code.errorType}</span>
                            <span class="tag-severity ${code.severity.toLowerCase()}">${code.severity} Severity</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>🚨 Symptoms</h4>
                    <ul>
                        ${code.symptoms.map(symptom => `<li>${symptom}</li>`).join('')}
                    </ul>
                </div>

                <div class="detail-section">
                    <h4>🔍 Possible Causes</h4>
                    <ul>
                        ${code.causes.map(cause => `<li>${cause}</li>`).join('')}
                    </ul>
                </div>

                <div class="detail-section">
                    <h4>🛠️ Solutions</h4>
                    <ol>
                        ${code.solutions.map(solution => `<li>${solution}</li>`).join('')}
                    </ol>
                </div>

                <div class="detail-section">
                    <h4>⚡ Immediate Actions</h4>
                    <ul class="urgent-actions">
                        ${code.immediateActions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>

                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Estimated Fix Time:</strong> ${code.estimatedFixTime} hours
                    </div>
                    <div class="detail-item">
                        <strong>Required Tools:</strong> ${code.requiredTools.join(', ')}
                    </div>
                    <div class="detail-item">
                        <strong>Affected Models:</strong> ${code.commonAffectedModels.join(', ')}
                    </div>
                </div>

                <div class="detail-section">
                    <h4>🛡️ Safety Precautions</h4>
                    <ul class="safety-list">
                        ${code.safetyPrecautions.map(precaution => `<li>${precaution}</li>`).join('')}
                    </ul>
                </div>

                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="reportThisError('${code.errorCode}')">
                        📝 Report This Error
                    </button>
                    <button class="btn btn-secondary" onclick="printErrorDetails('${code.errorCode}')">
                        🖨️ Print Details
                    </button>
                    <button class="btn btn-secondary" onclick="closeModal()">
                        Close
                    </button>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        document.getElementById('errorTypeFilter').value = '';
        document.getElementById('severityFilter').value = '';
        this.displayAllErrorCodes();
    }

    async initErrorCodeDatabase() {
        try {
            const response = await fetch('/api/error-codes/init', {
                method: 'POST'
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showNotification(`✅ ${result.message}`, 'success');
                await this.loadErrorCodes();
                this.displayAllErrorCodes();
            } else {
                this.showNotification('❌ Failed to initialize database', 'error');
            }
        } catch (error) {
            this.showNotification('❌ Error initializing database', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
}

// Global functions
function searchErrorCodes() {
    if (window.errorCodeManager) {
        window.errorCodeManager.searchErrorCodes();
    }
}

function clearSearch() {
    if (window.errorCodeManager) {
        window.errorCodeManager.clearSearch();
    }
}

function loadErrorCode(code) {
    if (window.errorCodeManager) {
        document.getElementById('searchInput').value = code;
        window.errorCodeManager.searchErrorCodes();
    }
}

function closeModal() {
    const modal = document.getElementById('errorCodeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function initErrorCodeDatabase() {
    if (window.errorCodeManager) {
        window.errorCodeManager.initErrorCodeDatabase();
    }
}

function viewAllErrorCodes() {
    if (window.errorCodeManager) {
        window.errorCodeManager.displayAllErrorCodes();
    }
}

function reportThisError(errorCode) {
    localStorage.setItem('prefilledErrorCode', errorCode);
    window.location.href = 'manual-entry.html';
}

function printErrorDetails(errorCode) {
    window.print();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.errorCodeManager = new ErrorCodeManager();
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('errorCodeModal');
        if (event.target === modal) {
            closeModal();
        }
    });
});
