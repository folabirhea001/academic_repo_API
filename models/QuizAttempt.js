const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedAnswer: {
    type: String,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  topic: {
    type: String,
    required: true
  }
});

const quizAttemptSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  answers: [answerSchema],
  weakTopics: [{
    type: String
  }],
  aiAnalysis: {
    type: String
  },
  recommendations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  }]
}, { timestamps: true });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);