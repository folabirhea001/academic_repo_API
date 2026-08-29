const { GoogleGenAI } = require('@google/genai');
const QuizAttempt = require('../models/QuizAttempt');
const Material = require('../models/Material');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const chat = async (req, res) => {
  try {
    const { message, history } = req.body;
    const student = req.student;

    // Get student's weak topics from most recent quiz attempt
    const latestAttempt = await QuizAttempt.findOne({
      studentId: student._id
    }).sort({ createdAt: -1 });

    const weakTopics = latestAttempt ? latestAttempt.weakTopics : [];

    // Get available materials for student's level
    const availableMaterials = await Material.find({
      level: student.level
    }).select('title course courseName category');

    const materialsList = availableMaterials
      .map(m => `${m.title} (${m.course} - ${m.category})`)
      .join(', ');

    // System context
    const systemContext = `
      You are an intelligent academic assistant for the FUTMinna Academic 
      Resources Repository, for the Information Technology department.
      
      You are helping this student:
      - Name: ${student.fullName}
      - Level: ${student.level} level
      - Department: ${student.department}
      - Weak topics from quizzes: ${weakTopics.length > 0 ? weakTopics.join(', ') : 'None identified yet'}
      
      Available materials in the repository:
      ${materialsList || 'No materials uploaded yet'}
      
      Your role:
      - Answer academic questions related to their courses
      - Recommend specific materials from the repository when relevant
      - Give study tips based on their weak topics
      - Be encouraging, friendly and concise
      - If asked about something outside academics, politely redirect
      - Always respond in plain paragraphs, no markdown or bullet points
    `;

    // Build conversation contents array
    const conversationHistory = history || [];

    const contents = [
      { role: 'user', parts: [{ text: systemContext }] },
      { role: 'model', parts: [{ text: `Understood. I am ready to assist ${student.fullName} as their personalised academic assistant.` }] },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents
    });

    res.json({
      message: response.text,
      student: {
        name: student.fullName,
        level: student.level,
        weakTopics
      }
    });

  } catch (error) {
    if (error.message && error.message.includes('quota')) {
      return res.status(429).json({ 
        message: 'AI assistant is temporarily busy. Please wait a moment and try again.' 
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { chat };