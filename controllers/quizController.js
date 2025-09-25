const fs = require('fs');
const path = require('path');
const User = require('../models/User');

exports.getQuestions = async (req, res) => {
    const filePath = path.join(__dirname, '../public/data/questions.json');
    const questions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.status(200).json(questions);
};

exports.submitQuiz = async (req, res) => {
    const { answers } = req.body; // {questionId: selectedOption}
    const filePath = path.join(__dirname, '../public/data/questions.json');
    const questions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    let score = 0;
    questions.forEach(q => {
        if (answers[q.id] === q.correct) score += 10;
    });

    const user = await User.findById(req.user.id);
    user.score += score;
    await user.save();

    res.status(200).json({ score, total: questions.length * 10 });
};
