jest.mock('openai', () => {
    const create = jest.fn();

    return {
        OpenAI: jest.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create,
                },
            },
        })),
        __createMock: create,
    };
});

jest.mock('../models/Conversation', () => ({
    findOneAndUpdate: jest.fn(),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { __createMock } = require('openai');
const Conversation = require('../models/Conversation');
const app = require('../app');

describe('AI route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    test('POST /api/ai/chat rejects missing token', async () => {
        const response = await request(app)
            .post('/api/ai/chat')
            .send({ message: 'Hello', language: 'Polish' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ message: 'No token, authorization denied' });
    });

    test('POST /api/ai/chat returns AI reply for valid token', async () => {
        __createMock.mockResolvedValue({
            choices: [{ message: { content: 'Cześć! Jak się masz?' } }],
        });

        const token = jwt.sign({ user: { id: 'user-id-3' }, type: 'access' }, process.env.JWT_SECRET);

        const response = await request(app)
            .post('/api/ai/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ message: 'Hello', language: 'Polish' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ reply: 'Cześć! Jak się masz?' });
        expect(__createMock).toHaveBeenCalledWith(
            expect.objectContaining({
                model: 'gpt-4o-mini',
            })
        );
        expect(Conversation.findOneAndUpdate).toHaveBeenCalledWith(
            { user: 'user-id-3', language: 'Polish' },
            expect.objectContaining({
                $push: {
                    messages: {
                        $each: [
                            { role: 'user', content: 'Hello', createdAt: expect.any(Date) },
                            { role: 'assistant', content: 'Cześć! Jak się masz?', createdAt: expect.any(Date) },
                        ],
                    },
                },
            }),
            expect.objectContaining({ upsert: true, new: true, setDefaultsOnInsert: true })
        );
    });
});
