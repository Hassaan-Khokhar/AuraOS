const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Hardcoded bypass for the owner to login easily
    if (email === 'alihassaan435@gmail.com' && password === 'admin123') {
       const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
       return res.json({ token, user: { email, role: 'admin' } });
    }

    // Demo account for recruiters / portfolio viewers
    if (email === 'demo@admin.com' && password === 'admin123') {
       const token = jwt.sign({ email, role: 'demo' }, process.env.JWT_SECRET, { expiresIn: '1d' });
       return res.json({ token, user: { email, role: 'demo' } });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
