const express = require('express');
const router = express.Router();
const { 
  registerStudent, 
  loginStudent, 
  loginAdmin 
} = require('../controllers/authController');

const { protectStudent } = require('../middleware/authMiddleware');


router.get('/student/profile', protectStudent, async (req, res) => {
  res.json({ student: req.student });
});
router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);
router.post('/admin/login', loginAdmin);

module.exports = router;