const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
    uuid: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    authors: { type: [String], required: true },
    cover: { type: String, required: true },
    summary: { type: String, required: false },
    language: { type: String, required: true },
    genres: { type: [String], required: false },
    editor: { type: String, required: false },
    publicationYear: { type: Number, required: false },
    pagesNumber: { type: Number, required: false },
    amazonLink: { type: String, required: false },
    kindleLink: { type: String, required: false },
    audibleLink: { type: String, required: false },
    fnacLink: { type: String, required: false }
});

module.exports = mongoose.model('Book', bookSchema);
