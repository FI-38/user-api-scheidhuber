// __tests__/api.test.js
import request from 'supertest';
import { describe, jest } from '@jest/globals'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';


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

describe('POST /api/login', () => {
  it('should return a token for valid login', async () => {
    getDatabaseConnection.mockResolvedValue({
      query: jest.fn().mockResolvedValue([
            { id: 1, username: 'testuser',
            password_hash: bcrypt.hashSync('password', 10) }
        ]),
        release: jest.fn(),
    });

    const response = await request(app)
        .post('/api/login')
        .send({ username: 'testuser', password: 'password' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('userId');
  });
});

describe('GET /api/profile', () => {
    // beforeEach(() => {
    //     getDatabaseConnection.mockResolvedValue({
    //         query: jest.fn().mockResolvedValue(
    //             [{ firstname: 'Test', surname: 'User', bio: 'Test Bio' }]),
    //         release: jest.fn(),
    //     });
    // });
});