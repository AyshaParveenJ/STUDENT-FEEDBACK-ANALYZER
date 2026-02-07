const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors()); 
app.use(express.json()); 

// --- DATABASE CONNECTION ---
mongoose.connect('mongodb://127.0.0.1:27017/feedbackDB')
  .then(() => console.log('✅ Connected to MongoDB: feedbackDB'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err));

// --- MODELS ---
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

// --- AUTHENTICATION ROUTES ---
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: "User already exists." });
    const newUser = new User({ username, password });
    await newUser.save();
    res.status(201).json({ message: "Success" });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (user) res.status(200).json({ message: "Login Successful" });
    else res.status(401).json({ error: "Invalid credentials" });
  } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// --- FEEDBACK ROUTES ---
app.post('/api/feedback', async (req, res) => {
  try {
    const entry = new Feedback(req.body);
    await entry.save();
    res.status(200).json({ message: "Success" });
  } catch (err) { res.status(500).json({ error: "Storage error" }); }
});

// --- STATS ROUTE FOR ADMIN DASHBOARD ---
app.get('/api/stats/:category', async (req, res) => {
  try {
    const data = await Feedback.find({ category: req.params.category });
    const total = data.length;
    const ratings = ['Poor', 'Fair', 'Very Good', 'Good', 'Excellent'];
    
    const stats = ratings.map(r => ({
      label: r,
      percentage: total > 0 ? ((data.filter(f => f.rating === r).length / total) * 100).toFixed(1) : 0
    }));
    res.json({ stats, total });
  } catch (err) { res.status(500).send(err); }
});

// --- NEW: SUGGESTIONS ROUTE FOR ADMIN DASHBOARD ---
app.get('/api/suggestions/:category', async (req, res) => {
  try {
    const { category } = req.params;
    // Fetches the username, course/event name, and the text suggestion
    const suggestions = await Feedback.find(
      { category: category }, 
      'user name suggestions'
    );
    res.status(200).json(suggestions);
  } catch (err) {
    res.status(500).json({ error: "Error fetching suggestions" });
  }
});

// --- SERVER START ---
const PORT = 5000;
app.listen(PORT, '127.0.0.1', () => console.log(`🚀 Server running at http://127.0.0.1:${PORT}`));