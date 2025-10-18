const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'verysecretkey';

// Registering of new User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).send({ message: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).send({ message: 'User exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, passwordHash });
    await user.save();
    res.send({ message: 'registered' });
  } catch (err) { console.error(err); res.status(500).send({ message: 'server error' }); }
});

//Login code, compares whether entered data and stored data matches
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).send({ message: 'invalid' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).send({ message: 'invalid' });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
res.send({ 
  token, 
  _id: user._id.toString(), 
  name: user.name, 
  email: user.email, 
  role: user.role 
});  } catch (err) { console.error(err); res.status(500).send({ message: 'server error' }); }
});

module.exports = router;
