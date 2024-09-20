import { Request, Response } from 'express';
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUser,
  updateUser,
  getMyProfile,
  updateMyself,
  enableUser,
  disableUser,
} from '../../../src/controllers/user.controller';
import { User } from '../../../src/models/user.model';
import { roleNameForBasicUsers } from '../../../src/utils/role.helper';
import { setupTestEnvironment } from '../../helpers/mock-test-setup';

// Mock external modules
jest.mock('../../../src/models/user.model');
jest.mock('crypto');
jest.mock('express-validator');

let req: Partial<Request>;
let res: Partial<Response>;
let jsonMock: jest.Mock;

const initTestEnvironment = setupTestEnvironment();

const userMock = { _id: '9', role: { _id: '91', name: roleNameForBasicUsers } };

describe('User Controller for Basic Users', () => {
  beforeEach(() => {
    const environment = initTestEnvironment();

    req = environment.req as Partial<Request>;
    res = environment.res as Partial<Response>;
    jsonMock = environment.jsonMock as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should return 403', async () => {
      req.body = { email: '', currentUser: userMock };

      await createUser(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'You are not allowed to access this resource!' });
    });
  });

  describe('getAllUsers', () => {
    it('should return 403', async () => {
      req.body.currentUser = userMock;

      await getAllUsers(req as Request, res as Response);

      expect(User.find).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You are not allowed to access this resource!' });
    });
  });

  describe('getUser', () => {
    it('should return 403 if user is not allowed to access the user', async () => {
      req.body.currentUser = userMock;

      await getUser(req as Request, res as Response);

      expect(User.findById).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You are not allowed to access this resource!' });
    });
  });

  describe('updateUser', () => {
    it('should return 403 because basic users cannot update here', async () => {
      req.params = { id: '123' };
      req.body = { fullName: 'Updated User', role: roleNameForBasicUsers, currentUser: userMock };

      await updateUser(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You are not allowed to access this resource!' });
    });
  });

  describe('deleteUser', () => {
    it('should return 403 because of not having access', async () => {
      req.params = { id: '9' };
      req.body.currentUser = userMock;

      await deleteUser(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You are not allowed to access this resource!' });
    });

    it('should return 403 because of basic users not allowed to delete users', async () => {
      req.params = { id: '1' };
      req.body.currentUser = userMock;

      await deleteUser(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You are not allowed to access this resource!' });
    });
  });

  describe('getMyProfile', () => {
    it('should return 200 and retrieve the current user profile', async () => {
      req.body.currentUser = { fullName: 'Test User', email: 'test@example.com' };

      await getMyProfile(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ data: req.body.currentUser });
    });
  });

  describe('updateMyself', () => {
    it('should return 200 when no parameters', async () => {
      await updateMyself(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Nothing changed!' });
    });

    it('should return 200 and update the current user successfully', async () => {
      const user = { ...userMock, fullName: 'My Updated Name' };

      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(user);

      req.body = { fullName: 'Test User', email: 'test@example.com', currentUser: userMock };

      await updateMyself(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ data: user });
    });

    it('should return 500 when an error occurs', async () => {
      req.body = { fullName: 'Test User', email: 'test@example.com', currentUser: userMock };

      (User.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('Test Error'));

      await updateMyself(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });
  });

  describe('enableUser', () => {
    it('should return 403', async () => {
      req.body.currentUser = userMock;

      await enableUser(req as Request, res as Response);

      expect(User.find).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Forbidden!' });
    });
  });

  describe('disableUser', () => {
    it('should return 403', async () => {
      req.body.currentUser = userMock;

      await disableUser(req as Request, res as Response);

      expect(User.find).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Forbidden!' });
    });
  });
});
