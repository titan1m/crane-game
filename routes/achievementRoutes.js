const express = require('express');
const router = express.Router();
const { getAchievements } = require('../controllers/achievementController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAchievements);

module.exports = router;
