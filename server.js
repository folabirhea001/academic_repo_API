const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({ 
  origin: true,
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes (we will add these one by one)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/quiz', require('./routes/quizRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

//Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'frontend')));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});