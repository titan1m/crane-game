const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/craneDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Error Code Schema
const errorCodeSchema = new mongoose.Schema({
    errorCode: { type: String, required: true, unique: true },
    errorType: { type: String, required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
    description: { type: String, required: true },
    symptoms: [String],
    causes: [String],
    solutions: [String],
    immediateActions: [String],
    requiredTools: [String],
    estimatedFixTime: Number,
    safetyPrecautions: [String],
    commonAffectedModels: [String],
    createdAt: { type: Date, default: Date.now }
});

const ErrorCode = mongoose.model('ErrorCode', errorCodeSchema);

// Report Schema
const reportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    errorCode: { type: String, required: true },
    craneModel: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
    createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

// Seed enhanced error codes
async function seedErrorCodes() {
    try {
        const count = await ErrorCode.countDocuments();
        if (count === 0) {
            const sampleErrors = [
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
            await ErrorCode.insertMany(sampleErrors);
            console.log('✅ Enhanced error codes seeded');
        }
    } catch (error) {
        console.error('❌ Error seeding error codes:', error);
    }
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Authentication required' });
    }
}

// Check auth status endpoint
app.get('/api/auth/status', (req, res) => {
    res.json({ 
        authenticated: !!req.session.userId,
        username: req.session.username 
    });
});

// Get user profile
app.get('/api/user/profile', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        const user = await User.findOne({ username });
        
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user._id;
            req.session.username = user.username;
            res.json({ 
                success: true, 
                message: 'Login successful',
                user: { username: user.username, email: user.email }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;
        
        // Validation
        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }] 
        });
        
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Username or email already exists' });
        }
        
        // Create new user
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({ 
            username, 
            email, 
            password: hashedPassword 
        });
        
        await user.save();
        
        // Auto-login after signup
        req.session.userId = user._id;
        req.session.username = user.username;
        
        res.json({ 
            success: true, 
            message: 'Account created successfully!',
            user: { username: user.username, email: user.email }
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        if (error.code === 11000) {
            res.status(409).json({ success: false, message: 'Username or email already exists' });
        } else {
            res.status(500).json({ success: false, message: 'Server error during registration' });
        }
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logout successful' });
    });
});

// Search error codes
app.get('/api/error-codes', async (req, res) => {
    try {
        const { code, errorType, severity, limit } = req.query;
        let query = {};
        
        if (code) {
            query.errorCode = new RegExp(code, 'i');
        }
        if (errorType && errorType !== 'All') {
            query.errorType = errorType;
        }
        if (severity && severity !== 'All') {
            query.severity = severity;
        }
        
        let queryBuilder = ErrorCode.find(query);
        
        if (limit) {
            queryBuilder = queryBuilder.limit(parseInt(limit));
        }
        
        const errorCodes = await queryBuilder.sort({ errorCode: 1 });
        res.json(errorCodes);
    } catch (error) {
        console.error('Error codes search error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get error code by ID
app.get('/api/error-codes/:code', async (req, res) => {
    try {
        const errorCode = await ErrorCode.findOne({ errorCode: req.params.code.toUpperCase() });
        if (!errorCode) {
            return res.status(404).json({ error: 'Error code not found' });
        }
        res.json(errorCode);
    } catch (error) {
        console.error('Error code fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Initialize error codes endpoint
app.post('/api/error-codes/init', async (req, res) => {
    try {
        await ErrorCode.deleteMany({});
        await seedErrorCodes();
        res.json({ success: true, message: 'Error code database initialized successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to initialize database' });
    }
});

// Create report
app.post('/api/reports', requireAuth, async (req, res) => {
    try {
        const { errorCode, craneModel, location, description } = req.body;
        
        if (!errorCode || !craneModel || !location) {
            return res.status(400).json({ success: false, message: 'Error code, crane model, and location are required' });
        }
        
        const report = new Report({
            userId: req.session.userId,
            errorCode: errorCode.toUpperCase(),
            craneModel,
            location,
            description: description || ''
        });
        
        await report.save();
        res.json({ success: true, message: 'Report created successfully', reportId: report._id });
    } catch (error) {
        console.error('Report creation error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user reports
app.get('/api/reports', requireAuth, async (req, res) => {
    try {
        const reports = await Report.find({ userId: req.session.userId })
            .sort({ createdAt: -1 })
            .populate('userId', 'username');
        res.json(reports);
    } catch (error) {
        console.error('Reports fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all error codes for dropdown
app.get('/api/all-error-codes', async (req, res) => {
    try {
        const errorCodes = await ErrorCode.find({}, 'errorCode description').sort({ errorCode: 1 });
        res.json(errorCodes);
    } catch (error) {
        console.error('All error codes fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get dashboard stats
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
        const totalErrors = await ErrorCode.countDocuments();
        const userReports = await Report.countDocuments({ userId: req.session.userId });
        const openIssues = await Report.countDocuments({ 
            userId: req.session.userId, 
            status: { $in: ['Open', 'In Progress'] } 
        });
        
        res.json({
            totalErrors,
            userReports,
            openIssues
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Initialize database and start server
async function startServer() {
    try {
        await seedErrorCodes();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📱 Application ready for desktop and mobile use`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
