import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static frontend files from /public

// MongoDB Schemas
const craneSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    model: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
    steps: [{ title: String, description: String, image: String }],
    lastMaintenance: { type: Date, default: Date.now }
});
const Crane = mongoose.model('Crane', craneSchema);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Serve HTML
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/manual-entry.html', (req, res) => res.sendFile(path.join(__dirname, 'public/manual-entry.html')));
app.get('/qr-scanner.html', (req, res) => res.sendFile(path.join(__dirname, 'public/qr-scanner.html')));
app.get('/signup.html', (req, res) => res.sendFile(path.join(__dirname, 'public/signup.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'public/login.html')));

// Crane API
app.get('/api/cranes', async (req, res) => {
    try { const cranes = await Crane.find(); res.json(cranes); }
    catch(e){ res.status(500).json({ message: e.message }); }
});

app.get('/api/crane/:code', async (req, res) => {
    try {
        const crane = await Crane.findOne({ code: req.params.code });
        if(!crane) return res.status(404).json({ message: 'Crane not found' });
        res.json(crane);
    } catch(e){ res.status(500).json({ message: e.message }); }
});

// Auth API
app.post('/api/auth/signup', async (req,res)=>{
    try {
        const { username, password } = req.body;
        if(!username || !password) return res.status(400).json({ message: 'Username and password required' });

        const existingUser = await User.findOne({ username });
        if(existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch(e){ res.status(500).json({ message: e.message }); }
});

app.post('/api/auth/login', async (req,res)=>{
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if(!user) return res.status(401).json({ message: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if(!match) return res.status(401).json({ message: 'Invalid credentials' });

        const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
        res.json({ token, message: 'Login successful' });
    } catch(e){ res.status(500).json({ message: e.message }); }
});

// Seed Sample Cranes
app.post('/api/seed', async (req,res)=>{
    try{
        const sampleCranes = [
            {
                code: "CRN-2023-001",
                model: "Tower Crane X-2000",
                description: "Hydraulic pressure low",
                severity: "high",
                steps:[
                    { title: "Check Fluid", description: "Check hydraulic fluid level" },
                    { title: "Inspect Leaks", description: "Inspect hydraulic lines" }
                ]
            },
            {
                code: "CRN-2023-002",
                model: "Mobile Crane Y-500",
                description: "Boom sensor inconsistent",
                severity: "medium",
                steps:[
                    { title: "Check Connections", description: "Check sensor connections" }
                ]
            }
        ];
        await Crane.deleteMany({});
        await Crane.insertMany(sampleCranes);
        res.json({ message: 'Sample data added successfully' });
    } catch(e){ res.status(500).json({ message: e.message }); }
});

// MongoDB Connect & Start
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/craneDB')
.then(()=>{ 
    console.log('✅ MongoDB Connected'); 
    app.listen(PORT, ()=>console.log(`🚀 Server running on port ${PORT}`));
})
.catch((err)=>console.error('❌ MongoDB connection error:', err));
