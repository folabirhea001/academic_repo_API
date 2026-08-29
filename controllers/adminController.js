const Material = require('../models/Material');
const Quiz = require('../models/Quiz');
const Student = require('../models/Student');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── UPLOAD MATERIAL ────────────────────────────────────────
const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const { title, description, category, course, courseName, level, department, tags } = req.body;

    const material = await Material.create({
      title,
      description,
      fileUrl: req.file.filename,
      fileType: path.extname(req.file.originalname).replace('.', '').toLowerCase(),
      category,
      course,
      courseName,
      level: Number(level),
      department,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      uploadedBy: req.admin._id
    });

    res.status(201).json({
      message: 'Material uploaded successfully',
      material
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET ALL MATERIALS ───────────────────────────────────────
const getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.find().sort({ createdAt: -1 });
    res.json({ count: materials.length, materials });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── DELETE MATERIAL ─────────────────────────────────────────
const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    await material.deleteOne();
    res.json({ message: 'Material deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── CREATE QUIZ ─────────────────────────────────────────────
const createQuiz = async (req, res) => {
  try {
    const { title, course, courseName, level, department, questions } = req.body;

    if (!questions || questions.length < 1) {
      return res.status(400).json({ message: 'A quiz must have at least one question' });
    }

    const quiz = await Quiz.create({
      title,
      course,
      courseName,
      level: Number(level),
      department,
      questions,
      createdBy: req.admin._id
    });

    res.status(201).json({
      message: 'Quiz created successfully',
      quiz
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET ALL QUIZZES ─────────────────────────────────────────
const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.json({ count: quizzes.length, quizzes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET ALL STUDENTS ─────────────────────────────────────────
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password').sort({ createdAt: -1 });
    res.json({ count: students.length, students });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// --- GET ONE STUDENT BY ID ─────────────────────────────────────────
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

//--- DELETE STUDENT BY ID ─────────────────────────────────────────
const deleteStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    await student.deleteOne();
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  } 
};

// ─── GENERATE QUIZ WITH AI ───────────────────────────────────
const generateQuizWithAI = async (req, res) => {
  try {
    const { title, course, courseName, level, department, topics, numQuestions } = req.body;

    if (!course || !courseName || !level || !topics) {
      return res.status(400).json({ 
        message: 'Please provide course, courseName, level and topics' 
      });
    }

    const questionCount = numQuestions || 10;

    // Ask Gemini to generate questions
    const prompt = `
      Generate exactly ${questionCount} multiple choice quiz questions for 
      ${courseName} (${course}), ${level} level Information Technology 
      students at Federal University of Technology Minna, Nigeria.
      
      Topics to cover: ${topics}
      
      Rules:
      - Each question must have exactly 4 options
      - Only one correct answer per question
      - Questions should be clear and academically appropriate
      - Cover different aspects of the topics provided
      - Vary difficulty between easy, medium and hard
      
      Return ONLY a valid JSON array. No explanation, no markdown, no backticks.
      Use exactly this structure:
      [
        {
          "questionText": "the question here",
          "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
          "correctAnswer": "exact text of correct option",
          "topic": "specific topic name"
        }
      ]
    `;

    const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
      contents: prompt
    });

    let rawText = response.text.trim();

    // Clean up response in case Gemini adds markdown
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    let questions;
    try {
      questions = JSON.parse(rawText);
    } catch (parseError) {
      return res.status(500).json({ 
        message: 'AI returned invalid format. Please try again.',
        raw: rawText
      });
    }

    // Validate questions structure
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({ 
        message: 'AI did not return valid questions. Please try again.' 
      });
    }

    // Save quiz to database
    const quiz = await Quiz.create({
      title: title || `${courseName} AI-Generated Quiz`,
      course,
      courseName,
      level: Number(level),
      department: department || 'Information Technology',
      questions,
      createdBy: req.admin._id
    });

    res.status(201).json({
      message: `Quiz generated successfully with ${questions.length} questions`,
      quiz
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  uploadMaterial,
  getAllMaterials,
  deleteMaterial,
  createQuiz,
  generateQuizWithAI,
  getAllQuizzes,
  getAllStudents,
  getStudentById,
  deleteStudentById
};