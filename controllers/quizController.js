const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Material = require('../models/Material');
const { GoogleGenAI } = require('@google/genai');

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

// ─── GET QUIZZES FOR STUDENT'S LEVEL ────────────────────────
const getQuizzesForStudent = async (req, res) => {
  try {
    const student = req.student;

    const quizzes = await Quiz.find({ 
      level: student.level 
    }).select('-questions.correctAnswer')
      .sort({ createdAt: -1 });

    res.json({ count: quizzes.length, quizzes });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET SINGLE QUIZ ─────────────────────────────────────────
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .select('-questions.correctAnswer');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.json({ quiz });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── SUBMIT QUIZ ─────────────────────────────────────────────
const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;
    const student = req.student;

    // Get the full quiz with correct answers
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if student already attempted this quiz
    const existingAttempt = await QuizAttempt.findOne({
      studentId: student._id,
      quizId: quiz._id
    });

    if (existingAttempt) {
      return res.status(400).json({ 
        message: 'You have already attempted this quiz',
        attempt: existingAttempt
      });
    }

    // Grade each answer
    let score = 0;
    const gradedAnswers = [];
    const topicScores = {};

    for (const question of quiz.questions) {
      const studentAnswer = answers.find(
        a => a.questionId === question._id.toString()
      );

      const isCorrect = studentAnswer && 
        studentAnswer.selectedAnswer === question.correctAnswer;

      if (isCorrect) score++;

      gradedAnswers.push({
        questionId: question._id,
        selectedAnswer: studentAnswer ? studentAnswer.selectedAnswer : 'Not answered',
        isCorrect: isCorrect || false,
        topic: question.topic
      });

      // Track score per topic
      if (!topicScores[question.topic]) {
        topicScores[question.topic] = { correct: 0, total: 0 };
      }
      topicScores[question.topic].total++;
      if (isCorrect) topicScores[question.topic].correct++;
    }

    // Identify weak topics (scored less than 50%)
    const weakTopics = Object.entries(topicScores)
      .filter(([topic, scores]) => scores.correct / scores.total < 0.5)
      .map(([topic]) => topic);

    // Build topic summary for Gemini
    const topicSummary = Object.entries(topicScores)
      .map(([topic, scores]) => 
        `${topic}: ${scores.correct}/${scores.total} correct`
      ).join(', ');

    // Call Gemini AI for analysis
    let aiAnalysis = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `
          A student in ${student.level} level, ${student.department} department 
          just completed a quiz on "${quiz.courseName}" (${quiz.course}).
          
          Results: ${score} out of ${quiz.questions.length} correct.
          Topic breakdown: ${topicSummary}.
          Weak topics: ${weakTopics.length > 0 ? weakTopics.join(', ') : 'None'}.
          
          Write a short, encouraging and personalized academic feedback (4-5 sentences).
          Mention the weak topics specifically and suggest what the student should focus on.
          Be direct, friendly and specific. Do not use bullet points.
        `
      });
      aiAnalysis = response.text;

    } catch (aiError) {
      aiAnalysis = `You scored ${score} out of ${quiz.questions.length}. ${
        weakTopics.length > 0
          ? `Focus on improving these topics: ${weakTopics.join(', ')}.`
          : 'Great job, keep it up!'
      }`;
    }

    // Find recommended materials based on weak topics
    let recommendations = [];
    if (weakTopics.length > 0) {
      const recommendedMaterials = await Material.find({
        level: student.level,
        $or: weakTopics.map(topic => ({
          tags: { $regex: topic, $options: 'i' }
        }))
      }).limit(5);

      recommendations = recommendedMaterials.map(m => m._id);
    }

    // Save the attempt
    const attempt = await QuizAttempt.create({
      studentId: student._id,
      quizId: quiz._id,
      score,
      totalQuestions: quiz.questions.length,
      answers: gradedAnswers,
      weakTopics,
      aiAnalysis,
      recommendations
    });

    // Return full result
    res.status(201).json({
      message: 'Quiz submitted successfully',
      result: {
        score,
        totalQuestions: quiz.questions.length,
        percentage: Math.round((score / quiz.questions.length) * 100),
        weakTopics,
        aiAnalysis,
        recommendations
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET STUDENT'S QUIZ HISTORY ──────────────────────────────
const getMyQuizHistory = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ 
      studentId: req.student._id 
    })
    .populate('quizId', 'title course courseName')
    .populate('recommendations', 'title fileUrl category')
    .sort({ createdAt: -1 });

    res.json({ count: attempts.length, attempts });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { 
  getQuizzesForStudent, 
  getQuizById, 
  submitQuiz, 
  getMyQuizHistory 
};