const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middlewares/verifyToken');

router.post('/signup', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(200).send({ message: 'Inscription réussie' });
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await user.isValidPassword(password))) {
        return res.status(400).send({ message: 'Nom d’utilisateur ou mot de passe incorrect' });
    }

    const token = localStorage.getItem('token');
    res.send({ token });
});

router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
