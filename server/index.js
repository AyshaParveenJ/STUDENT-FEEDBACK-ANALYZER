const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json()); 

// MongoDB Connection - Using 0.0.0.0 for better local compatibility
mongoose.connect('mongodb://127.0.0.1:27017/feedbackDB')
  .then(() => console.log('✅ Connected to MongoDB: feedbackDB'))
  .catch(err => console.error('❌ MongoDB Connection Error. Is MongoDB Service running?', err));

// Database Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const feedbackSchema = new mongoose.Schema({
  user: String,
  category: String,
  name: String,
  faculty: String,
  rating: String,
  suggestions: String,
  date: { type: Date, default: Date.now }
});
const Feedback = mongoose.model('Feedback', feedbackSchema);

// --- AUTH ROUTES ---
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: "User already exists." });
    const newUser = new User({ username, password });
    await newUser.save();
    res.status(201).json({ message: "Success" });
  } catch (err) { res.status(500).json({ error: "Signup failed" }); }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (user) res.status(200).json({ message: "Login Successful" });
    else res.status(401).json({ error: "Invalid credentials" });
  } catch (err) { res.status(500).json({ error: "Login failed" }); }
});

// --- FEEDBACK STORAGE (Fixed Storage Logic) ---
app.post('/api/feedback', async (req, res) => {
  try {
    const entry = new Feedback(req.body);
    await entry.save();
    console.log("📥 New Feedback Saved:", req.body);
    res.status(200).json({ message: "Saved" });
  } catch (err) { 
    console.error("❌ Database Error:", err);
    res.status(500).json({ error: "Could not save to database" }); 
  }
});

// --- ANALYTICS ROUTE FOR FACULTY ---
app.get('/api/stats/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const data = await Feedback.find({ category });
    const total = data.length;
    
    // Exact order from your student form
    const order = ['Poor', 'Fair', 'Very Good', 'Good', 'Excellent'];
    
    const stats = order.map(label => {
      const count = data.filter(f => f.rating === label).length;
      return {
        label,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : 0
      };
    });
    res.status(200).json({ stats, total });
  } catch (err) { res.status(500).json({ error: "Stats error" }); }
});

const PORT = 5000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Server running at http://127.0.0.1:${PORT}`);
});