const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Book = require('../models/Book');

router.get('/', async (req, res) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    const newBook = new Book({
        uuid: uuidv4(), // Générez un nouvel UUID pour chaque nouveau livre
        title: req.body.title,
        authors: req.body.authors, // Notez que c'est un tableau
        cover: req.body.cover,
        summary: req.body.summary,
        language: req.body.language,
        genres: req.body.genres, // Notez que c'est un tableau
        editor: req.body.editor,
        publicationYear: req.body.publicationYear,
        pagesNumber: req.body.pagesNumber,
        amazonLink: req.body.amazonLink,
        kindleLink: req.body.kindleLink,
        audibleLink: req.body.audibleLink,
        fnacLink: req.body.fnacLink
    });

    try {
        const savedBook = await newBook.save();
        res.status(201).json(savedBook);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: "Livre non trouvé" });
        }
        res.json(book);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:_id', getBook, async (req, res) => {
    console.log(res.book);
    try {
        await Book.deleteOne({ _id: res.book._id });
        res.json({ message: 'Book deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/genre/:genre', async (req, res) => {
    try {
        const books = await Book.find({ genres: req.params.genre });
        res.json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
);

async function getBook(req, res, next) {
    let book;
    try {
        book = await Book.findById(req.params._id);
        if (book == null) {
            return res.status(404).json({ message: 'Cannot find book' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.book = book;
    next();
}

module.exports = router;