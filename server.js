require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'crane-error-finder-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true
    }
}));

// MongoDB connection
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/craneDB';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

// User Schema
const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        minlength: 3
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        lowercase: true
    },
    password: { 
        type: String, 
        required: true,
        minlength: 6
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const User = mongoose.model('User', userSchema);

// Crane Error Schema
const craneErrorSchema = new mongoose.Schema({
    craneId: { 
        type: String, 
        required: true,
        trim: true
    },
    errorType: { 
        type: String, 
        required: true,
        enum: ['Mechanical', 'Electrical', 'Hydraulic', 'Software', 'Safety', 'Other']
    },
    severity: { 
        type: String, 
        required: true, 
        enum: ['Low', 'Medium', 'High', 'Critical'] 
    },
    description: { 
        type: String, 
        required: true,
        trim: true
    },
    reportedBy: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        default: 'Open', 
        enum: ['Open', 'In Progress', 'Resolved'] 
    },
    location: {
        type: String,
        trim: true
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    },
    resolvedAt: { 
        type: Date 
    },
    notes: {
        type: String
    }
});

const CraneError = mongoose.model('CraneError', craneErrorSchema);

// Error Code Database Schema
const errorCodeSchema = new mongoose.Schema({
    errorCode: { 
        type: String, 
        required: true, 
        unique: true,
        uppercase: true
    },
    errorType: { 
        type: String, 
        required: true,
        enum: ['Mechanical', 'Electrical', 'Hydraulic', 'Software', 'Safety', 'Electronic']
    },
    severity: { 
        type: String, 
        required: true, 
        enum: ['Low', 'Medium', 'High', 'Critical'] 
    },
    description: { 
        type: String, 
        required: true 
    },
    symptoms: [String],
    causes: [String],
    solutions: [String],
    immediateActions: [String],
    requiredTools: [String],
    estimatedFixTime: {
        type: Number,
        min: 0.5,
        max: 48
    },
    safetyPrecautions: [String],
    commonAffectedModels: [String]
}, {
    timestamps: true
});

const ErrorCode = mongoose.model('ErrorCode', errorCodeSchema);

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Not authenticated. Please login.' });
    }
};

// Routes

// Serve main pages
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Serve HTML pages
app.get('/:page', (req, res) => {
    const page = req.params.page;
    const allowedPages = [
        'index.html', 'dashboard.html', 'entry-mode.html', 'qr-scanner.html',
        'manual-entry.html', 'reports.html', 'settings.html', 'login.html', 
        'signup.html', 'error-codes.html', 'data-management.html'
    ];
    
    if (allowedPages.includes(page)) {
        res.sendFile(path.join(__dirname, 'public', page));
    } else {
        res.status(404).send('Page not found');
    }
});

// API Routes

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
        const userCount = await User.countDocuments();
        const errorCount = await CraneError.countDocuments();
        const errorCodeCount = await ErrorCode.countDocuments();
        
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: {
                status: dbStatus,
                users: userCount,
                errors: errorCount,
                errorCodes: errorCodeCount
            },
            session: req.session.userId ? 'Active' : 'Inactive'
        });
    } catch (error) {
        res.status(500).json({ error: 'Health check failed' });
    }
});

// User registration
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email or username' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const user = new User({ 
            username, 
            email, 
            password: hashedPassword
        });
        
        await user.save();
        
        req.session.userId = user._id;
        req.session.username = user.username;
        
        res.json({ 
            success: true, 
            message: 'User created successfully',
            username: user.username
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }
        
        req.session.userId = user._id;
        req.session.username = user.username;
        
        res.json({ 
            success: true, 
            message: 'Login successful',
            username: user.username
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logout successful' });
    });
});

// Get current user
app.get('/api/user', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const user = await User.findById(req.session.userId).select('-password');
        
        if (!user) {
            req.session.destroy();
            return res.status(401).json({ error: 'User not found' });
        }
        
        res.json({ 
            username: user.username,
            email: user.email,
            createdAt: user.createdAt
        });
        
    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

// Crane Error API Routes

// Create new error report
app.post('/api/errors', requireAuth, async (req, res) => {
    try {
        const { craneId, errorType, severity, description, location } = req.body;
        
        if (!craneId || !errorType || !severity || !description) {
            return res.status(400).json({ error: 'Crane ID, error type, severity, and description are required' });
        }
        
        const errorData = {
            craneId,
            errorType,
            severity,
            description,
            location: location || 'Not specified',
            reportedBy: req.session.username
        };
        
        const error = new CraneError(errorData);
        const savedError = await error.save();
        
        res.json({ 
            success: true, 
            message: 'Error reported successfully',
            error: savedError 
        });
        
    } catch (error) {
        console.error('Error creation failed:', error);
        res.status(500).json({ error: 'Failed to create error report' });
    }
});

// Get all errors
app.get('/api/errors', requireAuth, async (req, res) => {
    try {
        const errors = await CraneError.find().sort({ timestamp: -1 });
        res.json(errors);
    } catch (error) {
        console.error('Error fetching errors:', error);
        res.status(500).json({ error: 'Failed to fetch errors' });
    }
});

// Update error status
app.put('/api/errors/:id', requireAuth, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const errorId = req.params.id;
        
        if (!status || !['Open', 'In Progress', 'Resolved'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const updateData = { status };
        
        if (status === 'Resolved') {
            updateData.resolvedAt = new Date();
        }
        if (notes) updateData.notes = notes;
        
        const updatedError = await CraneError.findByIdAndUpdate(
            errorId, 
            updateData, 
            { new: true }
        );
        
        if (!updatedError) {
            return res.status(404).json({ error: 'Error not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Error updated successfully',
            error: updatedError 
        });
        
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update error' });
    }
});

// Delete error
app.delete('/api/errors/:id', requireAuth, async (req, res) => {
    try {
        const errorId = req.params.id;
        
        const result = await CraneError.findByIdAndDelete(errorId);
        
        if (!result) {
            return res.status(404).json({ error: 'Error not found' });
        }
        
        res.json({ success: true, message: 'Error deleted successfully' });
        
    } catch (error) {
        console.error('Error deleting:', error);
        res.status(500).json({ error: 'Failed to delete error' });
    }
});

// Clear all errors
app.delete('/api/errors', requireAuth, async (req, res) => {
    try {
        await CraneError.deleteMany({});
        res.json({ success: true, message: 'All errors deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear errors' });
    }
});

// Get error statistics
app.get('/api/stats', requireAuth, async (req, res) => {
    try {
        const totalErrors = await CraneError.countDocuments();
        const openErrors = await CraneError.countDocuments({ status: 'Open' });
        const inProgressErrors = await CraneError.countDocuments({ status: 'In Progress' });
        const resolvedErrors = await CraneError.countDocuments({ status: 'Resolved' });
        
        const severityStats = await CraneError.aggregate([
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);
        
        const errorTypeStats = await CraneError.aggregate([
            { $group: { _id: '$errorType', count: { $sum: 1 } } }
        ]);
        
        res.json({
            totalErrors,
            openErrors,
            inProgressErrors,
            resolvedErrors,
            severityStats,
            errorTypeStats
        });
        
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Initialize sample error data
app.post('/api/init-sample-data', requireAuth, async (req, res) => {
    try {
        // Clear existing data
        await CraneError.deleteMany({});
        
        const sampleErrors = [
            {
                craneId: "CRN-001",
                errorType: "Mechanical",
                severity: "High",
                description: "Hydraulic fluid leak in boom cylinder",
                location: "Construction Site A",
                reportedBy: req.session.username,
                status: "Open"
            },
            {
                craneId: "CRN-002",
                errorType: "Electrical", 
                severity: "Critical",
                description: "Control panel malfunction - emergency stop not working",
                location: "Warehouse 3",
                reportedBy: req.session.username,
                status: "In Progress"
            },
            {
                craneId: "CRN-003",
                errorType: "Hydraulic",
                severity: "Medium", 
                description: "Hydraulic pump making unusual noise",
                location: "Port Terminal",
                reportedBy: req.session.username,
                status: "Open"
            },
            {
                craneId: "CRN-004",
                errorType: "Safety",
                severity: "High",
                description: "Load moment indicator showing wrong readings",
                location: "High-rise Site",
                reportedBy: req.session.username,
                status: "Resolved",
                resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
                craneId: "CRN-005",
                errorType: "Software",
                severity: "Low",
                description: "Control system occasional freeze",
                location: "Automated Warehouse",
                reportedBy: req.session.username,
                status: "Open"
            }
        ];

        await CraneError.insertMany(sampleErrors);

        res.json({ 
            success: true, 
            message: 'Sample data initialized successfully',
            count: sampleErrors.length 
        });

    } catch (error) {
        console.error('Sample data initialization failed:', error);
        res.status(500).json({ error: 'Failed to initialize sample data' });
    }
});

// Error Code Database API Routes

// Get all error codes
app.get('/api/error-codes', requireAuth, async (req, res) => {
    try {
        const { search, errorType, severity } = req.query;
        let filter = {};
        
        if (search) {
            filter.$or = [
                { errorCode: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (errorType) filter.errorType = errorType;
        if (severity) filter.severity = severity;
        
        const errorCodes = await ErrorCode.find(filter).sort({ errorCode: 1 });
        res.json(errorCodes);
    } catch (error) {
        console.error('Error fetching error codes:', error);
        res.status(500).json({ error: 'Failed to fetch error codes' });
    }
});

// Get specific error code
app.get('/api/error-codes/:code', requireAuth, async (req, res) => {
    try {
        const errorCode = await ErrorCode.findOne({ 
            errorCode: req.params.code.toUpperCase() 
        });
        
        if (!errorCode) {
            return res.status(404).json({ error: 'Error code not found' });
        }
        
        res.json(errorCode);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch error code' });
    }
});

// Initialize error code database
app.post('/api/error-codes/init', requireAuth, async (req, res) => {
    try {
        const existingCount = await ErrorCode.countDocuments();
        if (existingCount > 0) {
            return res.json({ message: 'Error code database already initialized' });
        }

        const sampleErrorCodes = [
            {
                errorCode: "E001",
                errorType: "Hydraulic",
                severity: "High",
                description: "Hydraulic System Pressure Loss",
                symptoms: ["Slow boom movement", "Unable to lift rated loads", "Hydraulic fluid leakage"],
                causes: ["Hydraulic fluid leak", "Faulty pressure relief valve", "Worn pump seals"],
                solutions: ["Check and repair hydraulic lines", "Replace pressure relief valve", "Inspect and replace pump seals"],
                immediateActions: ["Stop crane operation immediately", "Check hydraulic fluid level", "Inspect for visible leaks"],
                requiredTools: ["Pressure gauge", "Wrench set", "Leak detection kit"],
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
                causes: ["Faulty emergency stop button", "Broken wiring in safety circuit"],
                solutions: ["Test and replace emergency stop button", "Check and repair safety circuit wiring"],
                immediateActions: ["Use secondary shutdown procedures", "Disconnect main power source"],
                requiredTools: ["Multimeter", "Wiring diagrams"],
                estimatedFixTime: 2,
                safetyPrecautions: ["Lock out/tag out power sources", "Test all safety systems after repair"],
                commonAffectedModels: ["All models with electronic controls"]
            },
            {
                errorCode: "E003",
                errorType: "Mechanical",
                severity: "Medium",
                description: "Boom Extension Mechanism Issue",
                symptoms: ["Boom extends unevenly", "Sticking during extension/retraction"],
                causes: ["Worn extension cables", "Damaged rollers or guides"],
                solutions: ["Inspect and replace extension cables", "Replace worn rollers and guides"],
                immediateActions: ["Do not extend boom further", "Retract boom slowly if possible"],
                requiredTools: ["Cable tension gauge", "Lubrication equipment"],
                estimatedFixTime: 6,
                safetyPrecautions: ["Secure boom before inspection", "Check load charts after repair"],
                commonAffectedModels: ["Telescopic boom cranes"]
            }
        ];

        await ErrorCode.insertMany(sampleErrorCodes);

        res.json({ 
            success: true, 
            message: 'Error code database initialized successfully',
            count: sampleErrorCodes.length 
        });

    } catch (error) {
        console.error('Error code initialization failed:', error);
        res.status(500).json({ error: 'Failed to initialize error code database' });
    }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
const startServer = async () => {
    try {
        await connectDB();
        
        app.listen(PORT, () => {
            console.log(`🚀 Crane Error Finder server running on port ${PORT}`);
            console.log(`📍 Access the application at: http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
