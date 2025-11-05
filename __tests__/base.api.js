import request from 'supertest';
const { app } = await import('../index');

describe('GET /', () => {
  it('should return hello world', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ hello: 'world' });
  });
});

describe('GET /api/name', () => {
    it('should return a name', async () => {
        const response = await request(app).get('/api/name');

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({name: 'Max'});
        expect(response.headers['content-type']).toMatch(/json/);
    });
});