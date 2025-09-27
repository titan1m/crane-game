import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// --- MongoDB Setup ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.log("MongoDB connection error:", err));

// --- Schemas ---
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});

const errorSchema = new mongoose.Schema({
  code: String,
  description: String,
  severity: String,
  type: String
});

const User = mongoose.model("User", userSchema);
const ErrorCode = mongoose.model("ErrorCode", errorSchema);

// --- JWT Middleware ---
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Routes ---

// Signup
app.post("/api/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Get Error Code
app.get("/api/error", authenticateToken, async (req, res) => {
  try {
    const { code } = req.query;
    const error = await ErrorCode.findOne({ code: code.toUpperCase() });
    if (!error) return res.json({ message: "Error code not found" });
    res.json(error);
  } catch (err) {
    res.status(500).json({ error: "Error fetching code" });
  }
});

// Add Error Code (Admin)
app.post("/api/error", authenticateToken, async (req, res) => {
  try {
    const { code, description, severity, type } = req.body;
    const newError = new ErrorCode({ code: code.toUpperCase(), description, severity, type });
    await newError.save();
    res.json({ message: "Error code added successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add error" });
  }
});

// Serve HTML pages
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
