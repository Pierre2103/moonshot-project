const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const token = localStorage.getItem('token');

    if (!token) {
        return res.status(403).send({ message: 'Aucun token fourni' });
    }

    jwt.verify(token, 'SECRET_KEY', (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Token non valide' });
        }

        req.userId = decoded.id;
        next();
    });
};
