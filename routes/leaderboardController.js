const User = require('../models/User');

exports.getLeaderboard = async (req, res) => {
    const leaderboard = await User.find().sort({ score: -1 }).limit(10).select('username score');
    res.status(200).json(leaderboard);
};
