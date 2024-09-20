import setupTestEnvironment from './helpers/live-test-setup';
import app from '../src/index';

const request = setupTestEnvironment(app); // Set up the test env

describe('Health Check', () => {
  // Test the health check endpoint
  it('should return status code 200 and the correct message', async () => {
    const response = await request.get('/api/v1/status');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('Up and running!');
  });
});

describe('Root Endpoint', () => {
  it('should return status code 200 and the correct message', async () => {
    const response = await request.get('/');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Hello from Scuba dive log app!');
  });
});
