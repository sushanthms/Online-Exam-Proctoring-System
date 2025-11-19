const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true, trim: true },
  passwordHash: String,
  role: { 
    type: String, 
    enum: ['student', 'admin'],
    default: 'student' 
  },
  // NEW: Face recognition fields
  faceDescriptor: {
    type: [Number], // Array of numbers representing face features
    default: null
  },
  isFaceRegistered: {
    type: Boolean,
    default: false
  },
  faceRegisteredAt: Date,
  
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('User', UserSchema);