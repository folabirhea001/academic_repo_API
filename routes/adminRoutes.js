const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  uploadMaterial,
  getAllMaterials,
  deleteMaterial,
  createQuiz,
  generateQuizWithAI,
  getAllQuizzes,
  getAllStudents
} = require('../controllers/adminController');

// Material routes
router.post('/materials/upload', protectAdmin, upload.single('file'), uploadMaterial);
router.get('/materials', protectAdmin, getAllMaterials);
router.delete('/materials/:id', protectAdmin, deleteMaterial);

// Quiz routes
router.post('/quiz/create', protectAdmin, createQuiz);
router.post('/quiz/generate', protectAdmin, generateQuizWithAI);
router.get('/quizzes', protectAdmin, getAllQuizzes);

// Student routes
router.get('/students', protectAdmin, getAllStudents);

module.exports = router;