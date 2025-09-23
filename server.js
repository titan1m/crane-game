import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error(err));

// Example API
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    // Save user in MongoDB (pseudo code)
    res.json({ message: "User registered!" });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    // Verify user (pseudo code)
    res.json({ message: "Logged in!", userId: "123", username: "Player" });
});

// Update score
app.post('/update-score', (req,res)=>{
    // Save score in MongoDB
    res.json({message:"Score updated"});
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
