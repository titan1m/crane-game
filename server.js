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
    secret: 'crane-error-finder-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/craneDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
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
    code: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
    solution: { type: String, required: true },
    category: { type: String, required: true },
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

// Seed sample error codes
async function seedErrorCodes() {
    const count = await ErrorCode.countDocuments();
    if (count === 0) {
        const sampleErrors = [
            {
                code: "E001",
                description: "Overload Protection Activated",
                severity: "High",
                solution: "Reduce load weight and reset system",
                category: "Safety"
            },
            {
                code: "E002",
                description: "Boom Angle Sensor Malfunction",
                severity: "Medium",
                solution: "Calibrate or replace boom angle sensor",
                category: "Sensors"
            },
            {
                code: "E003",
                description: "Hydraulic Pressure Low",
                severity: "High",
                solution: "Check hydraulic fluid level and pump",
                category: "Hydraulics"
            },
            {
                code: "E004",
                description: "Emergency Stop Activated",
                severity: "Critical",
                solution: "Check emergency stop buttons and reset",
                category: "Safety"
            },
            {
                code: "E005",
                description: "Wind Speed Exceeded",
                severity: "High",
                solution: "Wait for wind speed to decrease below safe limit",
                category: "Environmental"
            }
        ];
        await ErrorCode.insertMany(sampleErrors);
        console.log('Sample error codes seeded');
    }
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login.html');
    }
}

// Routes

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user._id;
            req.session.username = user.username;
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Signup endpoint
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.json({ success: false, message: 'Username or email already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        
        res.json({ success: true, message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logout successful' });
});

// Search error codes
app.get('/api/error-codes', async (req, res) => {
    try {
        const { code, category } = req.query;
        let query = {};
        
        if (code) {
            query.code = new RegExp(code, 'i');
        }
        if (category && category !== 'All') {
            query.category = category;
        }
        
        const errorCodes = await ErrorCode.find(query);
        res.json(errorCodes);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get error code by ID
app.get('/api/error-codes/:code', async (req, res) => {
    try {
        const errorCode = await ErrorCode.findOne({ code: req.params.code });
        if (!errorCode) {
            return res.status(404).json({ error: 'Error code not found' });
        }
        res.json(errorCode);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create report
app.post('/api/reports', requireAuth, async (req, res) => {
    try {
        const { errorCode, craneModel, location, description } = req.body;
        const report = new Report({
            userId: req.session.userId,
            errorCode,
            craneModel,
            location,
            description
        });
        await report.save();
        res.json({ success: true, message: 'Report created successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user reports
app.get('/api/reports', requireAuth, async (req, res) => {
    try {
        const reports = await Report.find({ userId: req.session.userId }).sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all error codes for dropdown
app.get('/api/all-error-codes', async (req, res) => {
    try {
        const errorCodes = await ErrorCode.find({}, 'code description');
        res.json(errorCodes);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Initialize database and start server
async function startServer() {
    try {
        await mongoose.connection.once('open', () => {
            console.log('Connected to MongoDB');
        });
        
        await seedErrorCodes();
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

startServer();
