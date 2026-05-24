const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    const authHeader = req.header('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
        if (error || !decoded || decoded.type !== 'access') {
            return res.status(401).json({ message: 'Token is not valid' });
        }

        req.user = decoded.user;
        return next();
    });
}

module.exports = auth;
