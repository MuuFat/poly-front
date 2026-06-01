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
    findOne: jest.fn(),
    create: jest.fn(),
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

    test('POST /api/ai/chat redirects off-topic prompts back to language tutoring', async () => {
        const token = jwt.sign({ user: { id: 'user-id-3' }, type: 'access' }, process.env.JWT_SECRET);

        const response = await request(app)
            .post('/api/ai/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ message: 'Tell me a joke', language: 'Polish' });

        expect(response.status).toBe(200);
        expect(response.body.reply).toContain('I only help with learning Polish');
        expect(__createMock).not.toHaveBeenCalled();
        expect(Conversation.findOne).not.toHaveBeenCalled();
        expect(Conversation.create).not.toHaveBeenCalled();
    });

    test('POST /api/ai/chat allows a language-learning question without keyword overlap', async () => {
        __createMock.mockResolvedValue({
            choices: [{ message: { content: 'Ser is for permanent states.' } }],
        });

        Conversation.findOne.mockResolvedValue(null);
        Conversation.create.mockResolvedValue({ _id: 'conversation-id-2' });

        const token = jwt.sign({ user: { id: 'user-id-3' }, type: 'access' }, process.env.JWT_SECRET);

        const response = await request(app)
            .post('/api/ai/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ message: 'What is the difference between ser and estar?', language: 'Spanish' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ reply: 'Ser is for permanent states.', conversationId: 'conversation-id-2' });
        expect(__createMock).toHaveBeenCalled();
        expect(Conversation.create).toHaveBeenCalled();
    });

    test('POST /api/ai/chat returns AI reply for a language learning request', async () => {
        __createMock.mockResolvedValue({
            choices: [{ message: { content: 'Cześć! Jak się masz?' } }],
        });

        Conversation.findOne.mockResolvedValue(null);
        Conversation.create.mockResolvedValue({ _id: 'conversation-id-1' });

        const token = jwt.sign({ user: { id: 'user-id-3' }, type: 'access' }, process.env.JWT_SECRET);

        const response = await request(app)
            .post('/api/ai/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ message: 'Please correct my sentence: I am student.', language: 'Polish', nativeLanguage: 'Russian' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ reply: 'Cześć! Jak się masz?', conversationId: 'conversation-id-1' });
        expect(__createMock).toHaveBeenCalledWith(
            expect.objectContaining({
                model: 'gpt-4o-mini',
            })
        );
        expect(__createMock.mock.calls[0][0].messages[0].content).toContain('You are a Polish language tutor. Explain Polish grammar, vocabulary, and corrections using the user\'s native language.');
        expect(__createMock.mock.calls[0][0].messages[0].content).toContain('User native language: Russian.');
        expect(Conversation.create).toHaveBeenCalledWith(
            expect.objectContaining({
                user: 'user-id-3',
                language: 'Polish',
                title: 'Please correct my sentence: I am student.',
                messages: [
                    { role: 'user', content: 'Please correct my sentence: I am student.', createdAt: expect.any(Date) },
                    { role: 'assistant', content: 'Cześć! Jak się masz?', createdAt: expect.any(Date) },
                ],
            })
        );
    });

    test('POST /api/ai/chat switches the tutor prompt to the selected learning language', async () => {
        __createMock.mockResolvedValue({
            choices: [{ message: { content: 'Hello! How can I help you learn Spanish?' } }],
        });

        Conversation.findOne.mockResolvedValue(null);
        Conversation.create.mockResolvedValue({ _id: 'conversation-id-4' });

        const token = jwt.sign({ user: { id: 'user-id-4' }, type: 'access' }, process.env.JWT_SECRET);

        const response = await request(app)
            .post('/api/ai/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ message: 'How do I say hello?', language: 'Spanish', nativeLanguage: 'English' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ reply: 'Hello! How can I help you learn Spanish?', conversationId: 'conversation-id-4' });
        expect(__createMock.mock.calls[0][0].messages[0].content).toContain('You are a Spanish language tutor. Explain Spanish grammar, vocabulary, and corrections using the user\'s native language.');
        expect(__createMock.mock.calls[0][0].messages[0].content).toContain('User native language: English.');
    });
});
