import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// MongoDB Schema
const craneSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    model: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    steps: [{
        title: String,
        description: String,
        image: String
    }],
    lastMaintenance: { type: Date, default: Date.now }
});

const Crane = mongoose.model('Crane', craneSchema);

// Auth Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Routes

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/error-info.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'error-info.html'));
});

// API Routes
app.get('/api/cranes', async (req, res) => {
    try {
        const cranes = await Crane.find();
        res.json(cranes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// FIXED: Correct API endpoint for single crane
app.get('/api/crane/:code', async (req, res) => {
    try {
        const crane = await Crane.findOne({ code: req.params.code });
        if (!crane) {
            return res.status(404).json({ message: 'Crane not found' });
        }
        res.json(crane);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Create new user (in real app, hash the password)
        const user = new User({ username, password });
        await user.save();
        
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user (in real app, verify hashed password)
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Simple token (in real app, use JWT)
        const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
        res.json({ token, message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add sample data
app.post('/api/seed', async (req, res) => {
    try {
        const sampleCranes = [
            {
                code: "CRN-2023-001",
                model: "Tower Crane X-2000",
                description: "Hydraulic pressure has dropped below the minimum operational threshold",
                severity: "high",
                steps: [
                    {
                        title: "Check Hydraulic Fluid Level",
                        description: "Locate the hydraulic fluid reservoir and check the fluid level"
                    },
                    {
                        title: "Inspect for Leaks", 
                        description: "Visually inspect all hydraulic lines for signs of leakage"
                    }
                ]
            },
            {
                code: "CRN-2023-002", 
                model: "Mobile Crane Y-500",
                description: "Boom angle sensor providing inconsistent readings",
                severity: "medium",
                steps: [
                    {
                        title: "Inspect Sensor Connections",
                        description: "Check all electrical connections for corrosion or looseness"
                    }
                ]
            }
        ];

        await Crane.deleteMany({});
        await Crane.insertMany(sampleCranes);
        
        res.json({ message: 'Sample data added successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/craneDB')
    .then(() => {
        console.log('✅ MongoDB Connected');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📧 Visit: http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error);
    });
