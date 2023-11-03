const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const booksRoutes = require('./routes/books');
const authRoutes = require('./routes/auth');
const verifyToken = require('./middlewares/verifyToken');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use('/books', booksRoutes);
app.use('/auth', authRoutes);

// Connexion à MongoDB
mongoose.connect('mongodb+srv://pgorin:aCszS5tDQm0FPGwH@cluster0.wq90aiv.mongodb.net/Books', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connexion à MongoDB réussie'))
.catch((err) => console.error('Connexion à MongoDB échouée', err));

// Routes (exemple)
app.get('/', (req, res) => {
  res.send('Bienvenue sur le backend !');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
