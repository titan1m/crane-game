import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// ✅ Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Error:", err));

// Schema Example (User + Scores)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  score: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// ✅ API Routes

// Save Score
app.post("/api/score", async (req, res) => {
  try {
    const { username, score } = req.body;
    let user = await User.findOne({ username });
    if (user) {
      if (score > user.score) {
        user.score = score;
        await user.save();
      }
    } else {
      user = new User({ username, score });
      await user.save();
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Leaderboard
app.get("/api/leaderboard", async (req, res) => {
  try {
    const users = await User.find().sort({ score: -1 }).limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
