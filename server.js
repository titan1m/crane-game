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
    secret: process.env.SESSION_SECRET || 'crane-error-finder-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// MongoDB connection
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

// Crane Error Schema
const craneErrorSchema = new mongoose.Schema({
    craneId: { type: String, required: true },
    errorType: { type: String, required: true },
    severity: { type: String, required: true, enum: ['Low', 'Medium', 'High', 'Critical'] },
    description: { type: String, required: true },
    reportedBy: { type: String, required: true },
    status: { type: String, default: 'Open', enum: ['Open', 'In Progress', 'Resolved'] },
    location: String,
    timestamp: { type: Date, default: Date.now },
    resolvedAt: Date,
    notes: String
});

const CraneError = mongoose.model('CraneError', craneErrorSchema);

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login.html');
    }
};

// Routes

// Serve main pages
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// API Routes

// User registration
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        
        req.session.userId = user._id;
        res.json({ success: true, message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        req.session.userId = user._id;
        req.session.username = user.username;
        res.json({ success: true, message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logout successful' });
});

// Get current user
app.get('/api/user', (req, res) => {
    if (req.session.userId) {
        res.json({ username: req.session.username });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Crane Error API Routes

// Create new error report
app.post('/api/errors', requireAuth, async (req, res) => {
    try {
        const errorData = {
            ...req.body,
            reportedBy: req.session.username
        };
        
        const error = new CraneError(errorData);
        await error.save();
        res.json({ success: true, error: error });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create error report' });
    }
});

// Get all errors
app.get('/api/errors', requireAuth, async (req, res) => {
    try {
        const errors = await CraneError.find().sort({ timestamp: -1 });
        res.json(errors);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch errors' });
    }
});

// Update error status
app.put('/api/errors/:id', requireAuth, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const updateData = { status };
        
        if (status === 'Resolved') {
            updateData.resolvedAt = new Date();
        }
        if (notes) {
            updateData.notes = notes;
        }
        
        const error = await CraneError.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true }
        );
        
        res.json({ success: true, error: error });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update error' });
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
        
        res.json({
            totalErrors,
            openErrors,
            inProgressErrors,
            resolvedErrors,
            severityStats
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
