jest.mock('../models/User', () => {
    const User = jest.fn().mockImplementation(function User(data) {
        Object.assign(this, data);
        this._id = this._id || 'user-id-1';
        this.save = jest.fn().mockResolvedValue(undefined);
    });

    User.findOne = jest.fn();
    User.findById = jest.fn();

    return User;
});

jest.mock('../models/Session', () => ({
    create: jest.fn(),
    findOne: jest.fn(),
}));

const request = require('supertest');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const app = require('../app');

describe('Auth routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-jwt-secret';
        process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
    });

    test('POST /api/auth/register creates a user and returns access and refresh tokens', async () => {
        User.findOne.mockResolvedValue(null);
        Session.create.mockResolvedValue({});

        jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('salt');
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password');

        const response = await request(app)
            .post('/api/auth/register')
            .set('User-Agent', 'Jest')
            .send({ username: 'Fatih', email: 'fatih@example.com', password: 'secret123' });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('User secured and created!');
        expect(response.body.user).toEqual({
            id: 'user-id-1',
            username: 'Fatih',
            email: 'fatih@example.com',
            targetLanguage: 'Polish',
        });
        expect(typeof response.body.token).toBe('string');
        expect(typeof response.body.refreshToken).toBe('string');
        expect(Session.create).toHaveBeenCalledWith(
            expect.objectContaining({
                user: 'user-id-1',
                tokenHash: crypto.createHash('sha256').update(response.body.refreshToken).digest('hex'),
            })
        );
    });

    test('POST /api/auth/register rejects an existing user', async () => {
        User.findOne.mockResolvedValue({ _id: 'existing-user' });

        const response = await request(app)
            .post('/api/auth/register')
            .send({ username: 'Fatih', email: 'fatih@example.com', password: 'secret123' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'User already exists' });
    });

    test('POST /api/auth/login returns tokens for valid credentials', async () => {
        User.findOne.mockResolvedValue({
            _id: 'user-id-2',
            username: 'Fatih',
            email: 'fatih@example.com',
            password: 'hashed-password',
            targetLanguage: 'Polish',
        });
        Session.create.mockResolvedValue({});

        jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'fatih@example.com', password: 'secret123' });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Login successful!');
        expect(response.body.user).toEqual({
            id: 'user-id-2',
            username: 'Fatih',
            email: 'fatih@example.com',
            targetLanguage: 'Polish',
        });
        expect(typeof response.body.token).toBe('string');
        expect(typeof response.body.refreshToken).toBe('string');
    });

    test('POST /api/auth/login rejects invalid password', async () => {
        User.findOne.mockResolvedValue({
            _id: 'user-id-2',
            username: 'Fatih',
            email: 'fatih@example.com',
            password: 'hashed-password',
            targetLanguage: 'Polish',
        });

        jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'fatih@example.com', password: 'wrong-password' });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: 'Invalid email or password' });
    });

    test('POST /api/auth/refresh returns a new access token when the refresh token is valid', async () => {
        const refreshToken = jwt.sign(
            { user: { id: 'user-id-2' }, type: 'refresh' },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        Session.findOne.mockResolvedValue({
            save: jest.fn().mockResolvedValue(undefined),
        });
        User.findById.mockResolvedValue({
            _id: 'user-id-2',
            username: 'Fatih',
            email: 'fatih@example.com',
        });

        const response = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Session refreshed');
        expect(response.body.user).toEqual({
            id: 'user-id-2',
            username: 'Fatih',
            email: 'fatih@example.com',
            targetLanguage: 'Polish',
        });
        expect(typeof response.body.token).toBe('string');
        expect(typeof response.body.refreshToken).toBe('string');
    });

    test('POST /api/auth/logout revokes the session for a valid refresh token', async () => {
        const refreshToken = jwt.sign(
            { user: { id: 'user-id-2' }, type: 'refresh' },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        const saveMock = jest.fn().mockResolvedValue(undefined);
        Session.findOne.mockResolvedValue({
            revokedAt: null,
            save: saveMock,
        });

        const response = await request(app)
            .post('/api/auth/logout')
            .send({ refreshToken });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Logged out' });
        expect(saveMock).toHaveBeenCalled();
    });
});
