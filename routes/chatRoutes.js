const express = require('express');
const router = express.Router();
const { protectStudent } = require('../middleware/authMiddleware');
const { chat } = require('../controllers/chatController');

router.post('/', protectStudent, chat);

module.exports = router;