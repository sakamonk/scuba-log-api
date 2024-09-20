import request from 'supertest';
import { Express } from 'express-serve-static-core';
import { userRoute } from '../../src/routes/user.route';
import { authenticateToken } from '../../src/middleware/authenticate.token';
import { roleNameForAdmins, roleNameForBasicUsers } from '../../src/utils/role.helper';
import express from 'express';

jest.mock('../../src/middleware/authenticate.token', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    // Mock token authentication success
    req.body.user = { role: roleNameForBasicUsers, _id: 'user_id_123' };
    next();
  }),
}));

jest.mock('../../src/controllers/user.controller', () => ({
  createUser: jest.fn((req, res) => res.status(201).json({ message: 'User created!' })),
  deleteUser: jest.fn((req, res) => res.status(200).json({ message: 'User deleted!' })),
  getAllUsers: jest.fn((req, res) => res.status(200).json({ message: 'Users fetched!' })),
  getUser: jest.fn((req, res) => res.status(200).json({ message: 'User fetched!' })),
  updateUser: jest.fn((req, res) => res.status(200).json({ message: 'User updated!' })),
  getMyProfile: jest.fn((req, res) => res.status(200).json({ message: 'Profile fetched!' })),
  updateMyself: jest.fn((req, res) => res.status(200).json({ message: 'Profile updated!' })),
  enableUser: jest.fn((req, res) => res.status(200).json({ message: 'User activated!' })),
  disableUser: jest.fn((req, res) => res.status(200).json({ message: 'User de-activated!' })),
}));

jest.mock('../../src/controllers/login.controller', () => ({
  loginUser: jest.fn((req, res) => res.status(200).json({ message: 'Login successful!' })),
}));

let app: Express;

beforeAll(() => {
  app = express();
  app.use(express.json()); // For parsing JSON request body
  app.use('/api/v1/', userRoute()); // Register the user routes
});

describe('User Routes - Authorization Tests', () => {
  describe('Routes for any authenticated user', () => {
    it('should allow any user to login (POST /users/login)', async () => {
      const res = await request(app).post('/api/v1/users/login').send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Login successful!');
    });

    it('should allow any user to get their profile (GET /me)', async () => {
      const res = await request(app).get('/api/v1/me');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Profile fetched!');
    });

    it('should allow any user to update their profile (PATCH /me/update)', async () => {
      const res = await request(app).patch('/api/v1/me/update').send({ updateData: 'basic user update' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Profile updated!');
    });
  });

  describe('Admin Role Access', () => {
    beforeEach(() => {
      // Set role to admin
      (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
        req.body.user = { role: roleNameForAdmins, _id: 'user_id_456' };
        next();
      });
    });

    it('should allow admin to create a user (POST /users)', async () => {
      const res = await request(app).post('/api/v1/users').send({ email: 'admin@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User created!');
    });

    it('should allow admin to get all users (GET /users)', async () => {
      const res = await request(app).get('/api/v1/users');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Users fetched!');
    });

    it('should allow admin to get a specific user (GET /users/:id)', async () => {
      const res = await request(app).get('/api/v1/users/123');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User fetched!');
    });

    it('should allow admin to update a specific user (PATCH /users/:id)', async () => {
      const res = await request(app).patch('/api/v1/users/123').send({ updateData: 'admin update' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User updated!');
    });

    it('should allow admin to delete a specific user (DELETE /users/:id)', async () => {
      const res = await request(app).delete('/api/v1/users/123');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User deleted!');
    });
  });

  it('should allow admin to enable a user (PATCH /users/activate/:id)', async () => {
    const res = await request(app).patch('/api/v1/users/activate/123');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User activated!');
  });

  it('should allow admin to disable a user (PATCH /users/deactivate/:id)', async () => {
    const res = await request(app).patch('/api/v1/users/deactivate/123');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('User de-activated!');
  });
});
