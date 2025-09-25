const Achievement = require('../models/Achievement');
const User = require('../models/User');

exports.getAchievements = async (req, res) => {
    const achievements = await Achievement.find();
    const user = await User.findById(req.user.id).populate('achievements');
    res.status(200).json({ achievements, userAchievements: user.achievements });
};
