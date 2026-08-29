const express = require('express');
const router = express.Router();
const { protectStudent } = require('../middleware/authMiddleware');
const {
  getQuizzesForStudent,
  getQuizById,
  submitQuiz,
  getMyQuizHistory
} = require('../controllers/quizController');

router.get('/', protectStudent, getQuizzesForStudent);
router.get('/history', protectStudent, getMyQuizHistory);
router.get('/:id', protectStudent, getQuizById);
router.post('/:id/submit', protectStudent, submitQuiz);

module.exports = router;