const express = require('express');
const router = express.Router();
const { protectStudent } = require('../middleware/authMiddleware');
const {
  getMaterials,
  getMaterialById,
  getRecommendedMaterials,
  logDownload
} = require('../controllers/materialController');

// All routes require student to be logged in
router.get('/', protectStudent, getMaterials);
router.get('/recommended', protectStudent, getRecommendedMaterials);
router.get('/:id', protectStudent, getMaterialById);
router.post('/:id/download', protectStudent, logDownload);

module.exports = router;