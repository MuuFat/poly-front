const request = require('supertest');

jest.mock('../models/User', () => ({
    find: jest.fn(),
}));

const User = require('../models/User');
const app = require('../app');

describe('Users route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('GET /api/users returns users without passwords', async () => {
        User.find.mockReturnValue({
            select: jest.fn().mockResolvedValue([
                { username: 'Fatih', email: 'fatih@example.com', targetLanguage: 'Polish' },
            ]),
        });

        const response = await request(app).get('/api/users');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            { username: 'Fatih', email: 'fatih@example.com', targetLanguage: 'Polish' },
        ]);
    });
});
