const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://<YOUR_MONGODB_ATLAS_URI>', { useNewUrlParser: true, useUnifiedTopology: true });

// User Schema
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String
}));

// Signup Route
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    await User.create({ username, email, password: hashed });
    res.json({ message: 'Signup successful!' });
  } catch {
    res.status(400).json({ error: 'User already exists' });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user._id }, 'secret', { expiresIn: '1d' });
  res.json({ token, username: user.username });
});

// Example Protected Route
app.get('/api/profile', async (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, 'secret');
    const user = await User.findById(decoded.userId).select('-password');
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.listen(5000, () => console.log('Server started'));
