// Sample data templates
const sampleErrors = {
    small: [
        {
            craneId: "CRN-001",
            errorType: "Mechanical",
            severity: "High",
            description: "Hydraulic fluid leak in boom cylinder",
            location: "Construction Site A"
        },
        {
            craneId: "CRN-002",
            errorType: "Electrical", 
            severity: "Critical",
            description: "Control panel malfunction - emergency stop not working",
            location: "Warehouse 3"
        },
        {
            craneId: "CRN-003",
            errorType: "Hydraulic",
            severity: "Medium", 
            description: "Hydraulic pump making unusual noise",
            location: "Port Terminal"
        },
        {
            craneId: "CRN-004",
            errorType: "Safety",
            severity: "High",
            description: "Load moment indicator showing wrong readings",
            location: "High-rise Site"
        },
        {
            craneId: "CRN-005",
            errorType: "Software",
            severity: "Low",
            description: "Control system occasional freeze",
            location: "Automated Warehouse"
        }
    ],
    
    large: [
        {
            craneId: "CRN-001",
            errorType: "Mechanical",
            severity: "High",
            description: "Hydraulic fluid leak in boom cylinder",
            location: "Construction Site A",
            status: "Open"
        },
        {
            craneId: "CRN-002",
            errorType: "Electrical", 
            severity: "Critical",
            description: "Control panel malfunction",
            location: "Warehouse 3",
            status: "In Progress",
            assignedTo: "Electrical Team"
        },
        {
            craneId: "CRN-003",
            errorType: "Hydraulic",
            severity: "Medium", 
            description: "Hydraulic pump noisy operation",
            location: "Port Terminal",
            status: "Open"
        },
        {
            craneId: "CRN-004",
            errorType: "Safety",
            severity: "High",
            description: "Safety system calibration needed",
            location: "High-rise Site",
            status: "Resolved",
            notes: "Calibration completed successfully"
        },
        {
            craneId: "CRN-005",
            errorType: "Software",
            severity: "Low",
            description: "Software minor glitch",
            location: "Automated Warehouse",
            status: "Closed"
        },
        {
            craneId: "CRN-006",
            errorType: "Mechanical",
            severity: "Critical", 
            description: "Boom mechanism jammed",
            location: "Bridge Site",
            status: "In Progress"
        },
        {
            craneId: "CRN-007",
            errorType: "Electrical",
            severity: "Medium",
            description: "Cab lighting not working",
            location: "Steel Plant",
            status: "Open"
        },
        {
            craneId: "CRN-008",
            errorType: "Hydraulic",
            severity: "High",
            description: "Cylinder seal failure",
            location: "Mining Operation",
            status: "Open"
        },
        {
            craneId: "CRN-009",
            errorType: "Safety",
            severity: "Critical",
            description: "Emergency stop malfunction",
            location: "Shipyard",
            status: "In Progress"
        },
        {
            craneId: "CRN-010",
            errorType: "Mechanical",
            severity: "Medium",
            description: "Wire rope wear detected",
            location: "Construction Site B",
            status: "Open"
        }
    ]
};

// Add sample data
async function addSampleData(size) {
    const errors = sampleErrors[size];
    const button = event.target;
    const originalText = button.innerHTML;
    
    button.disabled = true;
    button.innerHTML = '⏳ Adding...';
    
    try {
        let addedCount = 0;
        
        for (const errorData of errors) {
            const response = await fetch('/api/errors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(errorData)
            });
            
            if (response.ok) {
                addedCount++;
            }
        }
        
        app.showNotification(`✅ Added ${addedCount} sample errors successfully!`, 'success');
        loadDataStatus();
        loadSamplePreview();
        
    } catch (error) {
        console.error('Error adding sample data:', error);
        app.showNotification('❌ Failed to add sample data', 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// Add single error
async function addSingleError(event) {
    event.preventDefault();
    
    const formData = {
        craneId: document.getElementById('craneId').value,
        errorType: document.getElementById('errorType').value,
        severity: document.getElementById('severity').value,
        description: document.getElementById('description').value,
        location: "Added via Data Management"
    };
    
    const button = event.target.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    
    button.disabled = true;
    button.innerHTML = '⏳ Adding...';
    
    try {
        const response = await fetch('/api/errors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            app.showNotification('✅ Error added successfully!', 'success');
            document.getElementById('quickErrorForm').reset();
            loadDataStatus();
            loadSamplePreview();
        } else {
            throw new Error('Failed to add error');
        }
        
    } catch (error) {
        console.error('Error adding single error:', error);
        app.showNotification('❌ Failed to add error', 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// Load data status
async function loadDataStatus() {
    try {
        const response = await fetch('/api/stats');
        if (response.ok) {
            const stats = await response.json();
            
            document.getElementById('dataStatus').innerHTML = `
                <div class="status-grid">
                    <div class="status-item">
                        <span class="status-number">${stats.totalErrors}</span>
                        <span class="status-label">Total Errors</span>
                    </div>
                    <div class="status-item">
                        <span class="status-number">${stats.openErrors}</span>
                        <span class="status-label">Open</span>
                    </div>
                    <div class="status-item">
                        <span class="status-number">${stats.inProgressErrors}</span>
                        <span class="status-label">In Progress</span>
                    </div>
                    <div class="status-item">
                        <span class="status-number">${stats.resolvedErrors}</span>
                        <span class="status-label">Resolved</span>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('dataStatus').innerHTML = '<p>Error loading data status</p>';
    }
}

// Load sample preview
async function loadSamplePreview() {
    try {
        const response = await fetch('/api/errors?limit=3');
        if (response.ok) {
            const data = await response.json();
            const errors = data.errors || data;
            
            if (errors.length > 0) {
                document.getElementById('samplePreview').innerHTML = `
                    <div class="preview-list">
                        ${errors.map(error => `
                            <div class="preview-item">
                                <strong>${error.craneId}</strong> - ${error.errorType}
                                <br>
                                <small>${error.severity} • ${error.status}</small>
                            </div>
                        `).join('')}
                    </div>
                    <p><small>Showing latest ${errors.length} errors</small></p>
                `;
            } else {
                document.getElementById('samplePreview').innerHTML = '<p>No errors yet. Add some sample data!</p>';
            }
        }
    } catch (error) {
        document.getElementById('samplePreview').innerHTML = '<p>Error loading preview</p>';
    }
}

// Clear all data
async function clearAllData() {
    if (!confirm('⚠️ Are you sure you want to delete ALL error data? This cannot be undone!')) {
        return;
    }
    
    try {
        const response = await fetch('/api/errors', {
            method: 'DELETE'
        });
        
        if (response.ok) {
            app.showNotification('✅ All data cleared successfully!', 'success');
            loadDataStatus();
            loadSamplePreview();
        } else {
            throw new Error('Failed to clear data');
        }
    } catch (error) {
        app.showNotification('❌ Failed to clear data', 'error');
    }
}

// View all errors
function viewAllErrors() {
    window.location.href = 'reports.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadDataStatus();
    loadSamplePreview();
    
    // Setup form handler
    document.getElementById('quickErrorForm').addEventListener('submit', addSingleError);
    
    // Add navigation highlight
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.href.includes('data-management.html')) {
            link.classList.add('active');
        }
    });
});
