const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// ─── STUDENT REGISTER ───────────────────────────────────────
const registerStudent = async (req, res) => {
  const { matricNo, fullName, email, password, level, department } = req.body;

  try {
    // Check if student already exists
    const studentExists = await Student.findOne({ 
      $or: [{ matricNo }, { email }] 
    });

    if (studentExists) {
      return res.status(400).json({ 
        message: 'A student with this matric number or email already exists' 
      });
    }

    // Create new student
    const student = await Student.create({
      matricNo,
      fullName,
      email,
      password,
      level,
      department
    });

    res.status(201).json({
      message: 'Registration successful',
      student: {
        id: student._id,
        matricNo: student.matricNo,
        fullName: student.fullName,
        email: student.email,
        level: student.level,
        department: student.department
      },
      token: generateToken(student._id, 'student')
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── STUDENT LOGIN ───────────────────────────────────────────
const loginStudent = async (req, res) => {
  const { matricNo, password } = req.body;

  try {
    const student = await Student.findOne({ matricNo });

    if (!student) {
      return res.status(401).json({ message: 'Invalid matric number or password' });
    }

    const isMatch = await student.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid matric number or password' });
    }

    res.json({
      message: 'Login successful',
      student: {
        id: student._id,
        matricNo: student.matricNo,
        fullName: student.fullName,
        email: student.email,
        level: student.level,
        department: student.department
      },
      token: generateToken(student._id, 'student')
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── ADMIN LOGIN ─────────────────────────────────────────────
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      message: 'Admin login successful',
      admin: {
        id: admin._id,
        username: admin.username
      },
      token: generateToken(admin._id, 'admin')
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { registerStudent, loginStudent, loginAdmin };