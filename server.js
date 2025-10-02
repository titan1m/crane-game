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

// MongoDB connection (using local MongoDB for testing)
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/craneDB';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB successfully'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        console.log('💡 Using in-memory storage for demo purposes...');
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

// In-memory storage fallback
let memoryStorage = {
    users: [],
    errors: []
};

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Not authenticated. Please login.' });
    }
};

// Check if MongoDB is connected
const isMongoConnected = () => mongoose.connection.readyState === 1;

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
        'manual-entry.html', 'reports.html', 'settings.html', 'login.html', 'signup.html'
    ];
    
    if (allowedPages.includes(page)) {
        res.sendFile(path.join(__dirname, 'public', page));
    } else {
        res.status(404).send('Page not found');
    }
});

// API Routes

// User registration
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        let existingUser;
        
        if (isMongoConnected()) {
            existingUser = await User.findOne({ 
                $or: [{ email }, { username }] 
            });
        } else {
            existingUser = memoryStorage.users.find(user => 
                user.email === email || user.username === username
            );
        }
        
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email or username' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        
        if (isMongoConnected()) {
            const user = new User({ username, email, password: hashedPassword });
            await user.save();
            req.session.userId = user._id;
            req.session.username = user.username;
        } else {
            const user = {
                _id: 'user_' + Date.now(),
                username,
                email,
                password: hashedPassword,
                createdAt: new Date()
            };
            memoryStorage.users.push(user);
            req.session.userId = user._id;
            req.session.username = user.username;
        }
        
        res.json({ 
            success: true, 
            message: 'User created successfully',
            username: req.session.username
        });
    } catch (error) {
        console.error('Signup error:', error);
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
        
        let user;
        
        if (isMongoConnected()) {
            user = await User.findOne({ email });
        } else {
            user = memoryStorage.users.find(u => u.email === email);
        }
        
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
app.get('/api/user', (req, res) => {
    if (req.session.userId && req.session.username) {
        res.json({ 
            username: req.session.username,
            userId: req.session.userId
        });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Crane Error API Routes

// Create new error report
app.post('/api/errors', requireAuth, async (req, res) => {
    try {
        const { craneId, errorType, severity, description, location } = req.body;
        
        if (!craneId || !errorType || !severity || !description) {
            return res.status(400).json({ error: 'Required fields missing' });
        }
        
        const errorData = {
            craneId,
            errorType,
            severity,
            description,
            location: location || 'Not specified',
            reportedBy: req.session.username,
            status: 'Open',
            timestamp: new Date()
        };
        
        let savedError;
        
        if (isMongoConnected()) {
            const error = new CraneError(errorData);
            savedError = await error.save();
        } else {
            savedError = {
                _id: 'error_' + Date.now(),
                ...errorData
            };
            memoryStorage.errors.push(savedError);
        }
        
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
        let errors;
        
        if (isMongoConnected()) {
            errors = await CraneError.find().sort({ timestamp: -1 });
        } else {
            errors = memoryStorage.errors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        
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
        
        let updatedError;
        
        if (isMongoConnected()) {
            const updateData = { status };
            if (status === 'Resolved') {
                updateData.resolvedAt = new Date();
            }
            if (notes) {
                updateData.notes = notes;
            }
            
            updatedError = await CraneError.findByIdAndUpdate(
                errorId, 
                updateData, 
                { new: true }
            );
            
            if (!updatedError) {
                return res.status(404).json({ error: 'Error not found' });
            }
        } else {
            const errorIndex = memoryStorage.errors.findIndex(e => e._id === errorId);
            if (errorIndex === -1) {
                return res.status(404).json({ error: 'Error not found' });
            }
            
            memoryStorage.errors[errorIndex].status = status;
            if (status === 'Resolved') {
                memoryStorage.errors[errorIndex].resolvedAt = new Date();
            }
            if (notes) {
                memoryStorage.errors[errorIndex].notes = notes;
            }
            
            updatedError = memoryStorage.errors[errorIndex];
        }
        
        res.json({ 
            success: true, 
            message: 'Error status updated successfully',
            error: updatedError 
        });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update error status' });
    }
});

// Get error statistics
app.get('/api/stats', requireAuth, async (req, res) => {
    try {
        let errors;
        
        if (isMongoConnected()) {
            errors = await CraneError.find();
        } else {
            errors = memoryStorage.errors;
        }
        
        const totalErrors = errors.length;
        const openErrors = errors.filter(e => e.status === 'Open').length;
        const inProgressErrors = errors.filter(e => e.status === 'In Progress').length;
        const resolvedErrors = errors.filter(e => e.status === 'Resolved').length;
        
        const severityStats = [
            { _id: 'Low', count: errors.filter(e => e.severity === 'Low').length },
            { _id: 'Medium', count: errors.filter(e => e.severity === 'Medium').length },
            { _id: 'High', count: errors.filter(e => e.severity === 'High').length },
            { _id: 'Critical', count: errors.filter(e => e.severity === 'Critical').length }
        ];
        
        res.json({
            totalErrors,
            openErrors,
            inProgressErrors,
            resolvedErrors,
            severityStats
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Delete error
app.delete('/api/errors/:id', requireAuth, async (req, res) => {
    try {
        const errorId = req.params.id;
        
        if (isMongoConnected()) {
            const result = await CraneError.findByIdAndDelete(errorId);
            if (!result) {
                return res.status(404).json({ error: 'Error not found' });
            }
        } else {
            const errorIndex = memoryStorage.errors.findIndex(e => e._id === errorId);
            if (errorIndex === -1) {
                return res.status(404).json({ error: 'Error not found' });
            }
            memoryStorage.errors.splice(errorIndex, 1);
        }
        
        res.json({ success: true, message: 'Error deleted successfully' });
    } catch (error) {
        console.error('Error deleting:', error);
        res.status(500).json({ error: 'Failed to delete error' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: isMongoConnected() ? 'Connected' : 'Using memory storage',
        session: req.session.userId ? 'Active' : 'Inactive'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Crane Error Finder server running on port ${PORT}`);
    console.log(`📍 Access the application at: http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💾 Database: ${isMongoConnected() ? 'MongoDB Connected' : 'Using In-Memory Storage'}`);
});
