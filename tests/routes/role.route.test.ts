import request from 'supertest';
import { Express } from 'express-serve-static-core';
import { roleRoute } from '../../src/routes/role.route';
import { authenticateToken } from '../../src/middleware/authenticate.token';
import { roleNameForAdmins, roleNameForBasicUsers, roleNameForSuperAdmins } from '../../src/utils/role.helper';
import express from 'express';

jest.mock('../../src/middleware/authenticate.token', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    // Mock token authentication success
    req.body.user = { role: roleNameForSuperAdmins, _id: 'user_id_123' };
    next();
  }),
}));

jest.mock('../../src/middleware/authorize.role', () => ({
  authorizeSuperAdmin: jest.fn((req, res, next) => {
    if (req.body.user.role !== roleNameForSuperAdmins) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  }),
}));

jest.mock('../../src/controllers/role.controller', () => ({
  createRole: jest.fn((req, res) => res.status(201).json({ message: 'Role created!' })),
  deleteRole: jest.fn((req, res) => res.status(200).json({ message: 'Role deleted!' })),
  getAllRoles: jest.fn((req, res) => res.status(200).json({ message: 'Roles fetched!' })),
  getRole: jest.fn((req, res) => res.status(200).json({ message: 'Role fetched!' })),
  updateRole: jest.fn((req, res) => res.status(200).json({ message: 'Role updated!' })),
}));

let app: Express;

beforeAll(() => {
  app = express();
  app.use(express.json()); // For parsing JSON request body
  app.use('/api/v1/', roleRoute()); // Register the role route
});

describe('Role Routes - Authorization Tests', () => {
  describe('Superadmin Role Access', () => {
    it('should allow superadmin to create a role (POST /roles)', async () => {
      const res = await request(app).post('/api/v1/roles').send({ roleName: 'Test Role' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Role created!');
    });

    it('should allow superadmin to get all roles (GET /roles)', async () => {
      const res = await request(app).get('/api/v1/roles');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Roles fetched!');
    });

    it('should allow superadmin to get a specific role (GET /roles/:id)', async () => {
      const res = await request(app).get('/api/v1/roles/123');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Role fetched!');
    });

    it('should allow superadmin to update a role (PATCH /roles/:id)', async () => {
      const res = await request(app).patch('/api/v1/roles/123').send({ roleName: 'Updated Role' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Role updated!');
    });

    it('should allow superadmin to delete a role (DELETE /roles/:id)', async () => {
      const res = await request(app).delete('/api/v1/roles/123');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Role deleted!');
    });
  });

  describe('Admin Role Access', () => {
    beforeEach(() => {
      // Access for admins should be denied
      (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
        req.body.user = { role: roleNameForAdmins, _id: 'user_id_456' };
        next();
      });
    });

    it('should deny admin access to create a role (POST /roles)', async () => {
      const res = await request(app).post('/api/v1/roles').send({ roleName: 'Test Role' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden');
    });

    it('should deny admin access to get all roles (GET /roles)', async () => {
      const res = await request(app).get('/api/v1/roles');

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden');
    });

    it('should deny admin access to get a specific role (GET /roles/:id)', async () => {
      const res = await request(app).get('/api/v1/roles/123');

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden');
    });

    it('should deny admin access to update a role (PATCH /roles/:id)', async () => {
      const res = await request(app).patch('/api/v1/roles/123').send({ roleName: 'Updated Role' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden');
    });

    it('should deny admin access to delete a role (DELETE /roles/:id)', async () => {
      const res = await request(app).delete('/api/v1/roles/123');

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden');
    });
  });

  describe('Basic User Role Access', () => {
    beforeEach(() => {
      // Access for basic users should be denied
      (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
        req.body.user = { role: roleNameForBasicUsers, _id: 'user_id_789' };
        next();
      });
    });

    it('should deny basic user access to create a role (POST /roles)', async () => {
      const res = await request(app).post('/api/v1/roles').send({ roleName: 'Test Role' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden');
    });

    it('should deny basic user access to get all roles (GET /roles)', async () => {
      const res = await request(app).get('/api/v1/roles');

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden');
    });

    it('should deny basic user access to get a specific role (GET /roles/:id)', async () => {
      const res = await request(app).get('/api/v1//roles/123');

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden');
    });

    it('should deny basic user access to update a role (PATCH /roles/:id)', async () => {
      const res = await request(app).patch('/api/v1/roles/123').send({ roleName: 'Updated Role' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden');
    });

    it('should deny basic user access to delete a role (DELETE /roles/:id)', async () => {
      const res = await request(app).delete('/api/v1/roles/123');

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Forbidden');
    });
  });
});
