jest.mock('../models/Conversation', () => ({
    find: jest.fn(),
    findOne: jest.fn(),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');
const app = require('../app');

describe('Conversations routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-jwt-secret';
    });

    test('GET /api/conversations rejects missing token', async () => {
        const response = await request(app).get('/api/conversations');
        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'No token, authorization denied' });
    });

    test('GET /api/conversations returns summaries for authenticated user', async () => {
        const convs = [
            {
                _id: 'conv1',
                language: 'Polish',
                messages: [
                    { role: 'user', content: 'Hi' },
                    { role: 'assistant', content: 'Cześć' },
                ],
                updatedAt: new Date('2023-01-01'),
                createdAt: new Date('2023-01-01'),
            },
        ];

        Conversation.find.mockReturnValue({
            sort: () => ({ skip: () => ({ limit: () => ({ select: () => ({ lean: () => Promise.resolve(convs) }) }) }) }),
        });

        const token = jwt.sign({ user: { id: 'user-id-10' }, type: 'access' }, process.env.JWT_SECRET);

        const res = await request(app).get('/api/conversations').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.conversations).toBeInstanceOf(Array);
        expect(res.body.conversations[0]).toEqual(
            expect.objectContaining({
                id: 'conv1',
                language: 'Polish',
                messageCount: 2,
            })
        );
    });

    test('GET /api/conversations/:id returns paginated messages', async () => {
        const messages = [];
        for (let i = 0; i < 250; i++) messages.push({ role: i % 2 ? 'assistant' : 'user', content: `m${i}`, createdAt: new Date() });

        Conversation.findOne.mockResolvedValue({ _id: 'conv-big', user: 'user-id-10', language: 'Polish', messages });

        const token = jwt.sign({ user: { id: 'user-id-10' }, type: 'access' }, process.env.JWT_SECRET);

        const res = await request(app).get('/api/conversations/conv-big?page=1&limit=100').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.conversation).toHaveProperty('messages');
        expect(res.body.conversation.messages.length).toBe(100);
        expect(res.body.conversation.total).toBe(250);
    });
});
