const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'verysecretkey';

// Middleware for authentication (keep in this file)
function authenticate(req, res, next) {
  const bearer = req.headers.authorization;
  if (!bearer) {
    return res.status(401).json({ message: 'No authorization token' });
  }
  
  const token = bearer.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Admin only middleware
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. Admin privileges required.' 
    });
  }
  next();
}

// Register with role selection
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate role
    const userRole = (role === 'admin' || role === 'student') ? role : 'student';
    
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ 
      name, 
      email, 
      passwordHash,
      role: userRole 
    });
    
    await user.save();
    
    res.json({ 
      message: 'Registration successful',
      role: userRole 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login with role information
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        name: user.name
      }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );
    
    res.json({ 
      token, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user info
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});
router.post('/register-face', authenticate, async (req, res) => {
  try {
    const { faceDescriptor } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({ message: 'Invalid face descriptor' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.faceDescriptor = faceDescriptor;
    user.isFaceRegistered = true;
    user.faceRegisteredAt = new Date();
    await user.save();

    res.json({ 
      message: 'Face registered successfully',
      isFaceRegistered: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user face registration status
router.get('/face-status', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('isFaceRegistered faceRegisteredAt');
    res.json({ 
      isFaceRegistered: user.isFaceRegistered || false,
      faceRegisteredAt: user.faceRegisteredAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get face descriptor for verification
router.get('/face-descriptor', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('faceDescriptor isFaceRegistered');
    
    if (!user.isFaceRegistered) {
      return res.status(404).json({ message: 'Face not registered' });
    }

    res.json({ faceDescriptor: user.faceDescriptor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export middleware functions
module.exports = router;
module.exports.authenticate = authenticate;
module.exports.adminOnly = adminOnly;