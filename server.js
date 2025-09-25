const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: 'crane-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/craneDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// User Schema
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    userType: { type: String, default: 'regular' } // regular, admin, guest
});

const User = mongoose.model('User', userSchema);

// Crane Schema
const craneSchema = new mongoose.Schema({
    craneId: String,
    craneType: String, // tower, mobile, overhead
    model: String,
    serialNumber: String,
    location: String,
    lastMaintenance: Date,
    nextMaintenance: Date
});

const Crane = mongoose.model('Crane', craneSchema);

// Error Schema
const errorSchema = new mongoose.Schema({
    craneId: String,
    errorCode: String,
    description: String,
    severity: String, // low, medium, high, critical
    reportedBy: String,
    dateReported: { type: Date, default: Date.now },
    status: { type: String, default: 'pending' }, // pending, resolved
    solution: String
});

const ErrorReport = mongoose.model('ErrorReport', errorSchema);

// Maintenance Schema
const maintenanceSchema = new mongoose.Schema({
    craneId: String,
    maintenanceType: String,
    description: String,
    technician: String,
    datePerformed: Date,
    nextDueDate: Date,
    partsReplaced: [String]
});

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

// Routes

// Home Page
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user });
});

// Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = user;
        res.redirect('/dashboard');
    } else {
        res.render('login', { error: 'Invalid credentials' });
    }
});

// Register Page
app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
        username,
        email,
        password: hashedPassword
    });
    
    await newUser.save();
    res.redirect('/login');
});

// Guest Login
app.post('/guest-login', (req, res) => {
    req.session.user = { username: 'Guest', userType: 'guest' };
    res.redirect('/dashboard');
});

// Dashboard
app.get('/dashboard', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    const errors = await ErrorReport.find().limit(5);
    const cranes = await Crane.find();
    
    res.render('dashboard', { 
        user: req.session.user, 
        errors: errors,
        cranes: cranes 
    });
});

// Scanner Page
app.get('/scanner', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('scanner', { user: req.session.user });
});

// Manual Entry Page
app.get('/manual-entry', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('manual-entry', { user: req.session.user });
});

app.post('/report-error', async (req, res) => {
    const { craneId, errorCode, description, severity } = req.body;
    
    const newError = new ErrorReport({
        craneId,
        errorCode,
        description,
        severity,
        reportedBy: req.session.user.username
    });
    
    await newError.save();
    res.redirect('/defects');
});

// Defects Page
app.get('/defects', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    const errors = await ErrorReport.find().sort({ dateReported: -1 });
    res.render('defects', { user: req.session.user, errors: errors });
});

// Daily Maintenance Page
app.get('/maintenance', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('maintenance', { user: req.session.user });
});

app.post('/add-maintenance', async (req, res) => {
    const { craneId, maintenanceType, description, technician } = req.body;
    
    const newMaintenance = new Maintenance({
        craneId,
        maintenanceType,
        description,
        technician,
        datePerformed: new Date()
    });
    
    await newMaintenance.save();
    res.redirect('/maintenance');
});

// How to Use Page
app.get('/guide', (req, res) => {
    res.render('guide', { user: req.session.user });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
