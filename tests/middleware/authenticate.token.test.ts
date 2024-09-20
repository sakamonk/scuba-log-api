import jwt from 'jsonwebtoken';
import setupTestEnvironment from '../helpers/live-test-setup';
import app from '../../src/index';
import { roleNameForAdmins } from '../../src/utils/role.helper';
import { User } from '../../src/models/user.model';

// Mock external dependencies
jest.mock('jsonwebtoken');
jest.mock('../../src/models/user.model');

const request = setupTestEnvironment(app); // Set up the test env

const PROTECTED_ROUTE = '/api/v1/me'; // protected route to test authorization against

describe('AuthenticateToken middleware', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return 401 if no authorization header is provided', async () => {
    const response = await request.get(PROTECTED_ROUTE);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Token is missing!');
  });

  it('should return 401 if authorization header is present but token is missing', async () => {
    const response = await request.get(PROTECTED_ROUTE).set('Authorization', 'Bearer ');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Token is missing!');
  });

  it('should return 403 if token is invalid', async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const response = await request.get(PROTECTED_ROUTE).set('Authorization', 'Bearer invalidtoken');

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Token is invalid or expired!');
  });

  it('should return 404 if user is not found', async () => {
    const mockDecoded = { userId: 'mockUserId' };

    (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

    (User.findById as jest.Mock).mockImplementation(() => {
      return {
        populate: jest.fn().mockResolvedValue(null),
      };
    });

    const response = await request.get(PROTECTED_ROUTE).set('Authorization', 'Bearer validtoken');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found!');
  });

  it('should call next() and proceed to the next middleware if token and user are valid', async () => {
    const mockUserId = 'mockUserId';
    const mockDecoded = { userId: mockUserId };

    const mockRole = {
      _id: 'mockRoleId',
      name: roleNameForAdmins,
      description: 'Admin role',
    };

    const mockUser = {
      _id: 'mockUserId',
      name: 'Mock User',
      email: 'mock@example.com',
      password: 'mockPassword',
      enabled: true,
      role: mockRole,
    };

    (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

    (User.findById as jest.Mock).mockImplementation(() => {
      return {
        populate: jest.fn().mockResolvedValue(mockUser),
      };
    });

    const response = await request.get(PROTECTED_ROUTE).set('Authorization', 'Bearer validtoken');

    expect(response.status).toBe(200);
    expect(response.body.data).toStrictEqual(mockUser);
  });
});
