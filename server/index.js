const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors()); 
app.use(express.json()); 

// 1. Database Connection
mongoose.connect('mongodb://127.0.0.1:27017/feedbackDB')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ Connection Error:', err));

// 2. Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true }, 
  email: { type: String, unique: true, required: true }, 
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
  dept: String, 
  year: String, 
  date: { type: Date, default: Date.now }
});
const Feedback = mongoose.model('Feedback', feedbackSchema);

// 3. Auth Routes
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already registered" });
    await new User({ username, email, password }).save();
    res.status(201).json({ message: "Success" });
  } catch (err) { res.status(500).json({ error: "Signup error" }); }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (user) res.status(200).json({ username: user.username });
    else res.status(401).json({ error: "Invalid" });
  } catch (err) { res.status(500).json({ error: "Login error" }); }
});

// 4. Feedback Routes
app.post('/api/feedback', async (req, res) => {
  try { await new Feedback(req.body).save(); res.status(200).send("Saved"); }
  catch (err) { res.status(500).send("Error"); }
});

// STUDENT HISTORY
app.get('/api/user-history/:username', async (req, res) => {
  try {
    const history = await Feedback.find({ user: req.params.username }).sort({ date: -1 });
    res.json(history);
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

// ADMIN STATS WITH QUERY FILTER
app.get('/api/stats/:cat', async (req, res) => {
  try {
    const { dept, year } = req.query;
    let query = { category: req.params.cat };
    if (dept) query.dept = dept;
    if (year) query.year = year;

    const data = await Feedback.find(query);
    const total = data.length;
    const stats = ['Poor', 'Fair', 'Very Good', 'Good', 'Excellent'].map(r => ({
      label: r,
      percentage: total > 0 ? ((data.filter(f => f.rating === r).length / total) * 100).toFixed(1) : 0
    }));
    res.json({ stats, total });
  } catch (err) { res.status(500).send(err); }
});

// ADMIN SUGGESTIONS WITH QUERY FILTER
app.get('/api/suggestions/:cat', async (req, res) => {
  try {
    const { dept, year } = req.query;
    let query = { category: req.params.cat };
    if (dept) query.dept = dept;
    if (year) query.year = year;

    const data = await Feedback.find(query, 'user name suggestions dept year');
    res.json(data);
  } catch (err) { res.status(500).send(err); }
});

app.listen(5000, '127.0.0.1', () => console.log('🚀 Running on http://127.0.0.1:5000'));