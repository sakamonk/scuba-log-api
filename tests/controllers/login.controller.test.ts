import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { loginUser } from '../../src/controllers/login.controller';
import { User } from '../../src/models/user.model';
import { setupTestEnvironment } from '../helpers/mock-test-setup';

jest.mock('../../src/models/user.model');
jest.mock('crypto');
jest.mock('jsonwebtoken');

let req: Partial<Request>;
let res: Partial<Response>;
let jsonMock: jest.Mock;

const initTestEnvironment = setupTestEnvironment();

describe('Login Controller', () => {
  beforeEach(() => {
    const environment = initTestEnvironment();

    req = environment.req as Partial<Request>;
    res = environment.res as Partial<Response>;
    jsonMock = environment.jsonMock as jest.Mock;

    req = {
      body: {
        email: 'test@example.com',
        password: 'hashedPassword',
      },
    } as Partial<Request>;
  });

  describe('loginUser', () => {
    it('should return 404 if user is not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await loginUser(req as Request, res as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' }, { email: 1, password: 1, enabled: 1 });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User not found!' });
    });

    it('should return 401 if password is incorrect', async () => {
      const user = { _id: '123', email: 'test@example.com', password: 'hashedPassword', enabled: true };

      (User.findOne as jest.Mock).mockResolvedValue(user);

      // Mock crypto.pbkdf2Sync to return a different hash than the user's password
      (crypto.pbkdf2Sync as jest.Mock).mockReturnValue('differentHashedPassword');

      await loginUser(req as Request, res as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' }, { email: 1, password: 1, enabled: 1 });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid credentials!' });
    });

    it('should return 200 with token if login is successful', async () => {
      const user = { _id: '123', email: 'test@example.com', password: 'hashedPassword', enabled: true };

      (User.findOne as jest.Mock).mockResolvedValue(user);

      // Mock crypto.pbkdf2Sync to return the same hash as the user's password
      (crypto.pbkdf2Sync as jest.Mock).mockReturnValue('hashedPassword');

      // Mock jwt.sign to return a fake token
      (jwt.sign as jest.Mock).mockReturnValue('fakeToken');

      await loginUser(req as Request, res as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' }, { email: 1, password: 1, enabled: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ token: 'fakeToken' });
    });

    it('should return 403 if the user account does not have parameter enabled', async () => {
      const user = { _id: '123', email: 'test@example.com', password: 'hashedPassword' };

      (User.findOne as jest.Mock).mockResolvedValue(user);

      // Mock crypto.pbkdf2Sync to return the same hash as the user's password
      (crypto.pbkdf2Sync as jest.Mock).mockReturnValue('hashedPassword');

      // Mock jwt.sign to return a fake token
      (jwt.sign as jest.Mock).mockReturnValue('fakeToken');

      await loginUser(req as Request, res as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' }, { email: 1, password: 1, enabled: 1 });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'The account have been disabled!' });
    });

    it('should return 403 if the user account is disabled', async () => {
      const user = { _id: '123', email: 'test@example.com', enabled: false, password: 'hashedPassword' };

      (User.findOne as jest.Mock).mockResolvedValue(user);

      // Mock crypto.pbkdf2Sync to return the same hash as the user's password
      (crypto.pbkdf2Sync as jest.Mock).mockReturnValue('hashedPassword');

      // Mock jwt.sign to return a fake token
      (jwt.sign as jest.Mock).mockReturnValue('fakeToken');

      await loginUser(req as Request, res as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' }, { email: 1, password: 1, enabled: 1 });
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'The account have been disabled!' });
    });

    it('should return 500 if there is a server error', async () => {
      (User.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await loginUser(req as Request, res as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' }, { email: 1, password: 1, enabled: 1 });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Login failed!' });
    });
  });
});
