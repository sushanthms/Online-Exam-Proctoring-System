const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exam');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- Configure MongoDB ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/proctordb';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Use routes ---
app.use('/api/auth', authRoutes);
app.use('/api/exam', examRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

const faceLogRoutes = require("./routes/faceLog");

app.use("/api", faceLogRoutes);
