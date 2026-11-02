const request = require('supertest');
const app = require('../src/app');

describe('Health check', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth guard', () => {
  it('rejects cart access without a token', async () => {
    process.env.JWT_SECRET = 'test_secret';
    const res = await request(app).get('/api/cart');
    expect(res.statusCode).toBe(401);
  });
});
