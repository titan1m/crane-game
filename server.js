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
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Schemas
const craneSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    model: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
    steps: [{ title: String, description: String }],
    lastMaintenance: { type: Date, default: Date.now }
});

const Crane = mongoose.model('Crane', craneSchema);

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Routes - Serve frontend files
app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.get('/dashboard.html',(req,res)=>res.sendFile(path.join(__dirname,'public','dashboard.html')));
app.get('/entry-mode.html',(req,res)=>res.sendFile(path.join(__dirname,'public','entry-mode.html')));
app.get('/qr-scanner.html',(req,res)=>res.sendFile(path.join(__dirname,'public','qr-scanner.html')));
app.get('/manual-entry.html',(req,res)=>res.sendFile(path.join(__dirname,'public','manual-entry.html')));
app.get('/settings.html',(req,res)=>res.sendFile(path.join(__dirname,'public','settings.html')));
app.get('/reports.html',(req,res)=>res.sendFile(path.join(__dirname,'public','reports.html')));
app.get('/login.html',(req,res)=>res.sendFile(path.join(__dirname,'public','login.html')));
app.get('/signup.html',(req,res)=>res.sendFile(path.join(__dirname,'public','signup.html')));

// API - Cranes
app.get('/api/cranes', async (req,res)=>{
    try{
        const cranes = await Crane.find();
        res.json(cranes);
    }catch(err){
        res.status(500).json({message: err.message});
    }
});

app.get('/api/crane/:code', async (req,res)=>{
    try{
        const crane = await Crane.findOne({code:req.params.code});
        if(!crane) return res.status(404).json({message:'Crane not found'});
        res.json(crane);
    }catch(err){
        res.status(500).json({message: err.message});
    }
});

// Auth
app.post('/api/auth/signup', async (req,res)=>{
    try{
        const {username,password} = req.body;
        const existingUser = await User.findOne({username});
        if(existingUser) return res.status(400).json({message:'User already exists'});
        const user = new User({username,password});
        await user.save();
        res.status(201).json({message:'User created successfully'});
    }catch(err){
        res.status(500).json({message: err.message});
    }
});

app.post('/api/auth/login', async (req,res)=>{
    try{
        const {username,password} = req.body;
        const user = await User.findOne({username,password});
        if(!user) return res.status(401).json({message:'Invalid credentials'});
        const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
        res.json({token,message:'Login successful'});
    }catch(err){
        res.status(500).json({message: err.message});
    }
});

// Seed sample cranes
app.post('/api/seed', async (req,res)=>{
    try{
        const sampleCranes = [
            {
                code:"CRN-2023-001",
                model:"Tower Crane X-2000",
                description:"Hydraulic pressure below threshold",
                severity:"high",
                steps:[
                    {title:"Check Hydraulic Fluid", description:"Inspect reservoir levels"},
                    {title:"Inspect Leaks", description:"Check hydraulic lines for leaks"}
                ]
            },
            {
                code:"CRN-2023-002",
                model:"Mobile Crane Y-500",
                description:"Boom angle sensor inconsistent",
                severity:"medium",
                steps:[
                    {title:"Inspect Sensor Connections", description:"Check electrical connections"}
                ]
            }
        ];
        await Crane.deleteMany({});
        await Crane.insertMany(sampleCranes);
        res.json({message:'Sample cranes added'});
    }catch(err){
        res.status(500).json({message: err.message});
    }
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/craneDB')
.then(()=> {
    console.log('✅ MongoDB Connected');
    app.listen(PORT, ()=>console.log(`🚀 Server running on port ${PORT}`));
})
.catch(err=>console.error('❌ MongoDB connection error:',err));
