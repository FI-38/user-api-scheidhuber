// __tests__/api.test.js
import request from 'supertest';
import { jest } from '@jest/globals'
import jwt from 'jsonwebtoken';

// Mock der `db.js`-Datei mit `jest.unstable_mockModule`
jest.unstable_mockModule('../db', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      query: jest.fn().mockResolvedValue([]),
      release: jest.fn(),
    })),
}));
const getDatabaseConnection = (await import('../db')).default;

// dynamischer Import von app aus `index.js` nach dem Mock
const { app } = await import('../index');

describe('GET /api/users', () => {
    it('should return a JSON response with a list of users', async () => {
        // Im Test den Mock der Verbindung anpassen
        getDatabaseConnection.mockImplementation(() => ({
            query: jest.fn().mockResolvedValue([
                { id: 1, username: 'user1' },
                { id: 2, username: 'user2' },
            ]),
            release: jest.fn(),
        }));
        const response = await request(app).get('/api/users');

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            users: [
                { id: 1, username: 'user1' },
                { id: 2, username: 'user2' },
            ]});
        expect(response.headers['content-type']).toMatch(/json/);
    });
});


describe('Authentication Middleware', () => {
    it('should deny access without a token', async () => {
        const response = await request(app).get('/api/profile');
        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe('Nicht autorisiert');
    });

    it('should deny access with a not valid token', async () => {
        const token = jwt.sign({ id: 1, username: 'testuser' }, 'wrong-secret!!!');
        const response = await request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe('Token ungültig');
    });

    it('should allow access with a valid token', async () => {
        const token = jwt.sign(
            { id: 1, username: 'testuser' },
            process.env.JWT_SECRET_KEY
        );
        const response = await request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${token}`);
        expect(response.statusCode).toBe(200);
    });
});



describe('GET /', () => {
  it('should return hello world', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ hello: 'world' });
  });
});



test('adds 1 + 2 to equal 3', () => {
  expect(1 + 2).toBe(3);
});

