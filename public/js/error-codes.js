// public/js/error-codes.js - Enhanced version with better UI/UX
class ErrorCodeManager {
    constructor() {
        this.errorCodes = [];
        this.currentResults = [];
        this.init();
    }

    async init() {
        await this.loadErrorCodes();
        this.setupEventListeners();
        this.displayAllErrorCodes();
        this.updateDatabaseStats();
    }

    async loadErrorCodes() {
        try {
            const response = await fetch('/api/error-codes');
            if (response.ok) {
                this.errorCodes = await response.json();
                this.showNotification('✅ Error codes loaded successfully', 'success');
            } else {
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
                symptoms: ["Slow boom movement", "Unable to lift rated loads", "Hydraulic fluid leakage", "Unusual pump noises"],
                causes: ["Hydraulic fluid leak", "Faulty pressure relief valve", "Worn pump seals", "Clogged filters"],
                solutions: ["Check and repair hydraulic lines", "Replace pressure relief valve", "Inspect pump seals", "Replace hydraulic filters"],
                immediateActions: ["Stop crane operation immediately", "Check hydraulic fluid level", "Inspect for visible leaks"],
                requiredTools: ["Pressure gauge", "Wrench set", "Hydraulic test kit"],
                estimatedFixTime: 4,
                safetyPrecautions: ["Release hydraulic pressure before working", "Use proper PPE", "Secure boom before maintenance"],
                commonAffectedModels: ["LTM 1100", "GMK 3050", "AC 250", "RT 540"]
            },
            {
                errorCode: "E002",
                errorType: "Electrical",
                severity: "Critical", 
                description: "Emergency Stop Circuit Failure",
                symptoms: ["Emergency stop button not functioning", "Control panel error lights", "System won't power on"],
                causes: ["Faulty emergency stop button", "Broken wiring", "Control relay failure", "Fuse blown"],
                solutions: ["Test and replace emergency stop button", "Check safety circuit wiring", "Replace control relay", "Check fuses"],
                immediateActions: ["Use secondary shutdown procedures", "Disconnect main power", "Notify supervisor"],
                requiredTools: ["Multimeter", "Wiring diagrams", "Screwdriver set"],
                estimatedFixTime: 2,
                safetyPrecautions: ["Lock out/tag out power sources", "Test all safety systems", "Verify shutdown before working"],
                commonAffectedModels: ["All models with electronic controls"]
            },
            {
                errorCode: "E003",
                errorType: "Mechanical",
                severity: "High",
                description: "Boom Extension Mechanism Failure",
                symptoms: ["Boom not extending properly", "Unusual noises during extension", "Boom jerky movement"],
                causes: ["Worn extension cables", "Damaged hydraulic cylinders", "Misaligned guides", "Bent boom sections"],
                solutions: ["Inspect and replace extension cables", "Check hydraulic cylinders", "Realign boom guides", "Inspect boom sections"],
                immediateActions: ["Do not force boom extension", "Secure boom in current position", "Check for visible damage"],
                requiredTools: ["Cable tension gauge", "Alignment tools", "Inspection mirror"],
                estimatedFixTime: 6,
                safetyPrecautions: ["Secure boom properly", "Use fall protection", "Work with partner"],
                commonAffectedModels: ["RT 540", "GR 800", "NK 500", "ATF 220"]
            },
            {
                errorCode: "E004",
                errorType: "Safety",
                severity: "Critical",
                description: "Load Moment Indicator Malfunction",
                symptoms: ["LMI showing incorrect readings", "Warning alarms not functioning", "False overload warnings"],
                causes: ["Sensor calibration issues", "Wiring problems", "Software glitch", "Damaged sensors"],
                solutions: ["Recalibrate LMI sensors", "Check sensor wiring", "Update LMI software", "Replace damaged sensors"],
                immediateActions: ["Stop all lifting operations", "Use manual calculations", "Verify load manually"],
                requiredTools: ["Calibration kit", "Multimeter", "Laptop with software"],
                estimatedFixTime: 3,
                safetyPrecautions: ["Never bypass LMI system", "Verify with manual calculations", "Test after repair"],
                commonAffectedModels: ["All modern crane models"]
            },
            {
                errorCode: "E005",
                errorType: "Hydraulic",
                severity: "Medium",
                description: "Cylinder Drift Issue",
                symptoms: ["Boom slowly lowers when stationary", "Fluid leakage around cylinders", "Reduced lifting capacity"],
                causes: ["Worn piston seals", "Faulty control valves", "Internal cylinder damage", "Contaminated fluid"],
                solutions: ["Replace piston seals", "Repair or replace control valves", "Inspect cylinder internals", "Change hydraulic fluid"],
                immediateActions: ["Monitor drift rate", "Do not leave loads suspended", "Mark current position"],
                requiredTools: ["Seal kit", "Pressure test equipment", "Fluid analysis kit"],
                estimatedFixTime: 5,
                safetyPrecautions: ["Block boom before working", "Release all pressure", "Use proper lifting equipment"],
                commonAffectedModels: ["ATF 220", "TCC 1200", "LTM 1500", "GMK 4100"]
            }
        ];
    }

    setupEventListeners() {
        // Search input with debounce
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchErrorCodes();
                }, 300);
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
                ) ||
                code.causes.some(cause => 
                    cause.toLowerCase().includes(searchTerm.toLowerCase())
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

        this.currentResults = filteredCodes;
        this.displaySearchResults(filteredCodes);
    }

    displaySearchResults(results) {
        const resultsContainer = document.getElementById('searchResults');
        const resultsCount = document.getElementById('resultsCount');
        
        if (!resultsContainer) return;

        // Update results count
        if (resultsCount) {
            resultsCount.textContent = `(${results.length})`;
        }

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search fa-3x"></i>
                    <h4>No Error Codes Found</h4>
                    <p>No error codes match your search criteria. Try:</p>
                    <ul>
                        <li>Checking the error code spelling</li>
                        <li>Using different search terms</li>
                        <li>Clearing the filters</li>
                        <li>Viewing all error codes</li>
                    </ul>
                    <button onclick="viewAllErrorCodes()" class="btn btn-primary">
                        <i class="fas fa-eye"></i> View All Error Codes
                    </button>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = results.map(code => `
            <div class="error-code-item" onclick="errorCodeManager.showErrorDetails('${code.errorCode}')">
                <div class="error-code-header">
                    <div class="code-main">
                        <span class="code-badge ${code.severity.toLowerCase()}">${code.errorCode}</span>
                        <h4>${code.description}</h4>
                    </div>
                    <div class="code-tags">
                        <span class="error-type-tag">${code.errorType}</span>
                        <span class="severity-tag ${code.severity.toLowerCase()}">
                            <i class="fas fa-exclamation-circle"></i> ${code.severity}
                        </span>
                    </div>
                </div>
                <div class="error-code-content">
                    <p class="symptoms-preview"><strong>Symptoms:</strong> ${code.symptoms.slice(0, 2).join(', ')}${code.symptoms.length > 2 ? '...' : ''}</p>
                    <div class="error-code-meta">
                        <span class="meta-item">
                            <i class="fas fa-clock"></i> ${code.estimatedFixTime}h fix
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-tools"></i> ${code.requiredTools.length} tools
                        </span>
                        <span class="meta-item">
                            <i class="fas fa-crane"></i> ${code.commonAffectedModels.length} models
                        </span>
                    </div>
                </div>
                <div class="error-code-actions">
                    <button class="btn-view-details" onclick="event.stopPropagation(); errorCodeManager.showErrorDetails('${code.errorCode}')">
                        <i class="fas fa-info-circle"></i> View Details
                    </button>
                    <button class="btn-report" onclick="event.stopPropagation(); reportThisError('${code.errorCode}')">
                        <i class="fas fa-flag"></i> Report
                    </button>
                </div>
            </div>
        `).join('');
    }

    displayAllErrorCodes() {
        document.getElementById('searchInput').value = '';
        document.getElementById('errorTypeFilter').value = '';
        document.getElementById('severityFilter').value = '';
        this.currentResults = this.errorCodes;
        this.displaySearchResults(this.errorCodes);
    }

    showErrorDetails(errorCode) {
        const code = this.errorCodes.find(ec => ec.errorCode === errorCode);
        if (!code) return;

        const modal = document.getElementById('errorCodeModal');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalBody) {
            this.showNotification(`Error Code: ${code.errorCode}\nDescription: ${code.description}`, 'info');
            return;
        }

        modalBody.innerHTML = `
            <div class="error-details">
                <div class="detail-section">
                    <div class="detail-header">
                        <div class="detail-title">
                            <h3>${code.errorCode} - ${code.description}</h3>
                            <div class="detail-tags">
                                <span class="tag-type">${code.errorType}</span>
                                <span class="tag-severity ${code.severity.toLowerCase()}">
                                    <i class="fas fa-exclamation-triangle"></i> ${code.severity} Severity
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="detail-grid">
                    <div class="detail-card">
                        <div class="detail-card-header">
                            <i class="fas fa-clock"></i>
                            <h4>Estimated Fix Time</h4>
                        </div>
                        <div class="detail-card-content">
                            <span class="time-estimate">${code.estimatedFixTime} hours</span>
                        </div>
                    </div>
                    <div class="detail-card">
                        <div class="detail-card-header">
                            <i class="fas fa-tools"></i>
                            <h4>Tools Required</h4>
                        </div>
                        <div class="detail-card-content">
                            ${code.requiredTools.map(tool => `<span class="tool-tag">${tool}</span>`).join('')}
                        </div>
                    </div>
                    <div class="detail-card">
                        <div class="detail-card-header">
                            <i class="fas fa-crane"></i>
                            <h4>Affected Models</h4>
                        </div>
                        <div class="detail-card-content">
                            ${code.commonAffectedModels.map(model => `<span class="model-tag">${model}</span>`).join('')}
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-exclamation-triangle"></i> Symptoms</h4>
                    <ul class="symptoms-list">
                        ${code.symptoms.map(symptom => `<li>${symptom}</li>`).join('')}
                    </ul>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-search"></i> Possible Causes</h4>
                    <ul class="causes-list">
                        ${code.causes.map(cause => `<li>${cause}</li>`).join('')}
                    </ul>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-wrench"></i> Solutions</h4>
                    <ol class="solutions-list">
                        ${code.solutions.map(solution => `<li>${solution}</li>`).join('')}
                    </ol>
                </div>

                <div class="detail-section urgent">
                    <h4><i class="fas fa-bolt"></i> Immediate Actions Required</h4>
                    <ul class="urgent-actions">
                        ${code.immediateActions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>

                <div class="detail-section safety">
                    <h4><i class="fas fa-shield-alt"></i> Safety Precautions</h4>
                    <ul class="safety-list">
                        ${code.safetyPrecautions.map(precaution => `<li>${precaution}</li>`).join('')}
                    </ul>
                </div>

                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="reportThisError('${code.errorCode}')">
                        <i class="fas fa-flag"></i> Report This Error
                    </button>
                    <button class="btn btn-secondary" onclick="printErrorDetails('${code.errorCode}')">
                        <i class="fas fa-print"></i> Print Details
                    </button>
                    <button class="btn btn-outline" onclick="closeModal()">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `;

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        document.getElementById('errorTypeFilter').value = '';
        document.getElementById('severityFilter').value = '';
        this.displayAllErrorCodes();
    }

    async initErrorCodeDatabase() {
        try {
            this.showNotification('🔄 Initializing error code database...', 'info');
            
            const response = await fetch('/api/error-codes/init', {
                method: 'POST'
            });
            
            if (response.ok) {
                const result = await response.json();
                this.showNotification(`✅ ${result.message}`, 'success');
                await this.loadErrorCodes();
                this.displayAllErrorCodes();
                this.updateDatabaseStats();
            } else {
                this.showNotification('❌ Failed to initialize database', 'error');
            }
        } catch (error) {
            this.showNotification('❌ Error initializing database', 'error');
        }
    }

    updateDatabaseStats() {
        const totalCodes = this.errorCodes.length;
        const criticalCodes = this.errorCodes.filter(code => code.severity === 'Critical').length;
        const categories = [...new Set(this.errorCodes.map(code => code.errorType))].length;

        document.getElementById('totalCodes').textContent = totalCodes;
        document.getElementById('criticalCodes').textContent = criticalCodes;
        document.getElementById('categories').textContent = categories;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
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
        document.body.style.overflow = 'auto';
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

    // Escape key to close modal
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    // Mobile menu toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
});
