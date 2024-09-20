import request from 'supertest';
import { Express } from 'express-serve-static-core';
import { logbookRoute } from '../../src/routes/logbook.route';
import { roleNameForAdmins, roleNameForBasicUsers, roleNameForSuperAdmins } from '../../src/utils/role.helper';
import express from 'express';

// Mock middlewares and controllers
jest.mock('../../src/middleware/authenticate.token', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    // Mock token authentication success
    req.body.user = { role: roleNameForBasicUsers, _id: 'user_id_123' };
    next();
  }),
}));

jest.mock('../../src/middleware/authorize.role', () => ({
  authorizeAdmin: jest.fn((req, res, next) => {
    if (req.body.user.role !== roleNameForAdmins) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  }),
  authorizeSuperAdmin: jest.fn((req, res, next) => {
    if (req.body.user.role !== roleNameForSuperAdmins) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  }),
}));

jest.mock('../../src/controllers/logbook.controller', () => ({
  createLog: jest.fn((req, res) => res.status(201).json({ message: 'Log created!' })),
  deleteLog: jest.fn((req, res) => res.status(200).json({ message: 'Log deleted!' })),
  getAllLogs: jest.fn((req, res) => res.status(200).json({ message: 'Logs fetched!' })),
  getLog: jest.fn((req, res) => res.status(200).json({ message: 'Log fetched!' })),
  updateLog: jest.fn((req, res) => res.status(200).json({ message: 'Log updated!' })),
}));

let app: Express;

beforeAll(() => {
  app = express();
  app.use(express.json()); // For parsing JSON request body
  app.use('/api/v1/', logbookRoute()); // Register the logbook route
});

describe('Logbook Routes - Authorization Tests', () => {
  describe('Routes for any authenticated user', () => {
    it('should allow any user to create a log (POST /logbooks)', async () => {
      const res = await request(app).post('/api/v1/logbooks').send({ logData: 'test log data' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Log created!');
    });

    it('should allow any user to get all logs (GET /logbooks)', async () => {
      const res = await request(app).get('/api/v1/logbooks');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logs fetched!');
    });

    it('should allow any user to get a specific log (GET /logbooks/:id)', async () => {
      const res = await request(app).get('/api/v1/logbooks/123');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Log fetched!');
    });

    it('should allow any user to update a specific log (PATCH /logbooks/:id)', async () => {
      const res = await request(app).patch('/api/v1/logbooks/123').send({ updateData: 'test update' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Log updated!');
    });

    it('should allow any user to delete a specific log (DELETE /logbooks/:id)', async () => {
      const res = await request(app).delete('/api/v1/logbooks/123');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Log deleted!');
    });
  });
});
