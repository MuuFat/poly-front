const crypto = require('crypto');

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function isValidEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isNonEmptyString(value, minLength = 1, maxLength = Infinity) {
    return typeof value === 'string' && value.trim().length >= minLength && value.trim().length <= maxLength;
}

module.exports = {
    hashToken,
    isValidEmail,
    isNonEmptyString,
};
