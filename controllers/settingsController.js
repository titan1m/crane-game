const User = require('../models/User');

exports.getSettings = async (req, res) => {
    const user = await User.findById(req.user.id).select('settings');
    res.status(200).json(user.settings);
};

exports.updateSettings = async (req, res) => {
    const { darkMode, sound } = req.body;
    const user = await User.findById(req.user.id);
    user.settings.darkMode = darkMode;
    user.settings.sound = sound;
    await user.save();
    res.status(200).json(user.settings);
};
