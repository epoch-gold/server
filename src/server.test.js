const request = require('supertest');
const { app } = require('./server');

describe('API Endpoints', () => {
  describe('GET /', () => {
    test('returns "Hello World" with status 200', async () => {
      const response = await request(app)
        .get('/')
        .expect('Content-Type', /text\/html/)
        .expect(200);

      expect(response.text).toBe('Hello World');
    });
  });
});