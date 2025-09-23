import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("MongoDB Error ❌:", err));

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  highScore: { type: Number, default: 0 },
  level: { type: String, default: "Easy" }
});
const User = mongoose.model("User", userSchema);

// Register
app.post("/register", async (req,res)=>{
  try{
    const {username,email,password} = req.body;
    if(await User.findOne({email})) return res.status(400).json({message:"Email already registered"});
    const hashed = await bcrypt.hash(password,10);
    const newUser = new User({username,email,password:hashed});
    await newUser.save();
    res.status(201).json({message:"User registered ✅"});
  }catch(err){ res.status(500).json({message:"Error registering user"});}
});

// Login
app.post("/login", async(req,res)=>{
  try{
    const {email,password} = req.body;
    const user = await User.findOne({email});
    if(!user) return res.status(400).json({message:"User not found"});
    if(!await bcrypt.compare(password,user.password)) return res.status(400).json({message:"Invalid password"});
    res.json({message:"Login successful ✅",userId:user._id,username:user.username});
  }catch(err){res.status(500).json({message:"Error logging in"});}
});

// Update Score
app.post("/update-score", async(req,res)=>{
  try{
    const {userId,score,level} = req.body;
    const user = await User.findById(userId);
    if(!user) return res.status(400).json({message:"User not found"});
    if(score>user.highScore){user.highScore=score; user.level=level; await user.save();}
    res.json({message:"Score updated ✅"});
  }catch(err){res.status(500).json({message:"Error updating score"});}
});

// Profile
app.get("/profile/:userId", async(req,res)=>{
  try{
    const user = await User.findById(req.params.userId).select("-password");
    if(!user) return res.status(404).json({message:"User not found"});
    res.json(user);
  }catch(err){res.status(500).json({message:"Error fetching profile"});}
});

// Leaderboard
app.get("/leaderboard", async(req,res)=>{
  try{
    const topUsers = await User.find().sort({highScore:-1}).limit(10).select("username highScore level");
    res.json(topUsers);
  }catch(err){res.status(500).json({message:"Error fetching leaderboard"});}
});

// Game route
app.get("/game", (req,res)=>{res.sendFile(path.join(__dirname,"public","game.html"));});

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
