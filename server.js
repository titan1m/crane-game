// server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (public folder)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  score: { type: Number, default: 0 },
  achievements: {
    streaks: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    completedQuizzes: { type: Number, default: 0 },
  },
});

const User = mongoose.model("User", userSchema);

//
// ------------------ Routes ------------------
//

// Register
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashed,
    });
    await user.save();

    res.json({ message: "✅ User registered successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Server error" });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    res.json({
      message: "✅ Logged in successfully!",
      userId: user._id,
      username: user.username,
      achievements: user.achievements,
      score: user.score,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Server error" });
  }
});

// Update score & achievements
app.post("/update-score", async (req, res) => {
  try {
    const { userId, score, streak } = req.body;
    const user = await User.findById(userId);

    if (!user) return res.status(400).json({ message: "User not found" });

    // Update score only if higher
    if (score > user.score) user.score = score;

    // Update achievements
    if (streak > user.achievements.streaks) user.achievements.streaks = streak;
    if (score > user.achievements.maxScore) user.achievements.maxScore = score;
    user.achievements.completedQuizzes += 1;

    await user.save();
    res.json({ message: "✅ Score updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Server error" });
  }
});

// Leaderboard
app.get("/leaderboard", async (req, res) => {
  try {
    const top = await User.find().sort({ score: -1 }).limit(10);
    res.json(top);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Server error" });
  }
});

// Get user profile
app.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      username: user.username,
      email: user.email,
      achievements: user.achievements,
      score: user.score,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Server error" });
  }
});

// Update user profile
app.put("/user/:id", async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.username = username || user.username;
    user.email = email || user.email;

    await user.save();
    res.json({ message: "✅ Profile updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Server error" });
  }
});

// ------------------ Start Server ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
