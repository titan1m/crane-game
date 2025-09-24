import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.error("MongoDB connection error:", err));

// User schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  score: { type: Number, default: 0 },
  achievements: { streaks: Number, maxScore: Number, completedQuizzes: Number }
});
const User = mongoose.model("User", userSchema);

// Register
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if username or email exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(400).json({ message: "Username or Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashed,
      achievements: { streaks: 0, maxScore: 0, completedQuizzes: 0 }
    });
    await user.save();
    res.json({ message: "User registered!" });
  } catch(err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if(!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) return res.status(400).json({ message: "Incorrect password" });

    res.json({
      message: "Logged in!",
      userId: user._id,
      username: user.username,
      achievements: user.achievements,
      score: user.score
    });
  } catch(err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update score and achievements
app.post("/update-score", async (req, res) => {
  try {
    const { userId, score, streak } = req.body;
    const user = await User.findById(userId);
    if(!user) return res.status(404).json({ message: "User not found" });

    user.score = Math.max(score, user.score);
    if(streak > user.achievements.streaks) user.achievements.streaks = streak;
    if(score > user.achievements.maxScore) user.achievements.maxScore = score;
    user.achievements.completedQuizzes += 1;

    await user.save();
    res.json({ message: "Score updated" });
  } catch(err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Leaderboard
app.get("/leaderboard", async (req, res) => {
  try {
    const top = await User.find().sort({ score: -1 }).limit(5);
    res.json(top);
  } catch(err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get user profile
app.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if(!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch(err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update user profile
app.put("/user/:id", async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.params.id);
    if(!user) return res.status(404).json({ message: "User not found" });

    user.username = username;
    user.email = email;
    await user.save();
    res.json({ message: "Profile updated" });
  } catch(err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
