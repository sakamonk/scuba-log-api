import crypto from 'crypto';
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
import { Role } from '../../../src/models/role.model';
import { roleNameForSuperAdmins, roleNameForAdmins, roleNameForBasicUsers } from '../../../src/utils/role.helper';
import { setupTestEnvironment } from '../../helpers/mock-test-setup';
import { validationResult } from 'express-validator';

// Mock external modules
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/role.model');
jest.mock('crypto');
jest.mock('express-validator');

let req: Partial<Request>;
let res: Partial<Response>;
let jsonMock: jest.Mock;

const initTestEnvironment = setupTestEnvironment();

const userMock = { _id: '9', role: { _id: '91', name: roleNameForBasicUsers } };
const adminMock = { _id: '99', role: { _id: '991', name: roleNameForSuperAdmins } };
const superAdminMock = { _id: '999', role: { _id: '9991', name: roleNameForSuperAdmins } };

describe('User Controller for SuperAdmins', () => {
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
    it('should return 422 if required fields are missing', async () => {
      req.body = { email: '', currentUser: superAdminMock };

      await createUser(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'The fields email, fullName, and password are mandatory!' });
    });

    it('should return 400 if user already exists', async () => {
      req.body = { email: 'test@example.com', fullName: 'Test User', password: 'password123', currentUser: superAdminMock };
      (validationResult as unknown as jest.Mock).mockReturnValue({ isEmpty: () => true });

      (User.findOne as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

      await createUser(req as Request, res as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User with this email already exists!' });
    });

    it('should return 403 when giving non existent role name', async () => {
      req.body = {
        email: 'test@example.com',
        roleName: 'Role does not exist',
        fullName: 'Test User',
        password: 'password123',
        currentUser: superAdminMock,
      };
      (validationResult as unknown as jest.Mock).mockReturnValue({ isEmpty: () => true });

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (Role.findOne as jest.Mock).mockResolvedValue(null);

      await createUser(req as Request, res as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(Role.findOne).toHaveBeenCalledWith({ name: 'Role does not exist' });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Role with name "Role does not exist" not found!' });
    });

    it('should return 201 and create a user successfully', async () => {
      req.body = { email: 'test@example.com', fullName: 'Test User', password: 'password123', currentUser: superAdminMock };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (Role.findOne as jest.Mock).mockResolvedValue({ _id: '1', name: roleNameForBasicUsers });
      (User.create as jest.Mock).mockResolvedValue(req.body);
      (crypto.pbkdf2Sync as jest.Mock).mockReturnValue('hashedPassword');
      (validationResult as unknown as jest.Mock).mockReturnValue({ isEmpty: () => true });

      await createUser(req as Request, res as Response);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          fullName: 'Test User',
          password: 'hashedPassword',
        }),
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ data: req.body });
    });
  });

  describe('getAllUsers', () => {
    it('should return 200 and retrieve all users', async () => {
      req.body.currentUser = superAdminMock;

      const users = [{ fullName: 'Test User', email: 'test@example.com' }];

      (User.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(users),
      });

      await getAllUsers(req as Request, res as Response);

      expect(User.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ data: users });
    });
  });

  describe('getUser', () => {
    it('should return 404 if user not found', async () => {
      req.params = { id: '123' };
      req.body.currentUser = superAdminMock;

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await getUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User with id "123" not found!' });
    });

    it('should return 200 and retrieve a specific user', async () => {
      req.params = { id: '123' };
      req.body.currentUser = superAdminMock;
      const user = { fullName: 'Test User', email: 'test@example.com' };

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(user),
      });

      await getUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ data: user });
    });
  });

  describe('updateUser', () => {
    it('should return 404 if user is not found', async () => {
      req.params = { id: '1231' };
      req.body = { fullName: 'Test Name', currentUser: superAdminMock };

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await updateUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('1231');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User with id "1231" not found!' });
    });

    it('should return 422 if required fields are missing', async () => {
      const user = { _id: '123', email: 'test@example.com', password: 'hashedPassword', role: { name: roleNameForBasicUsers } };

      (User.findOne as jest.Mock).mockResolvedValue(user);

      req.body = { currentUser: superAdminMock };

      await updateUser(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'The field fullName is mandatory!' });
    });

    it('should return 200 and update the user successfully', async () => {
      const originalUser = { fullName: 'Test User', email: 'test@example.com', password: 'hashedPassword', role: { name: roleNameForBasicUsers } };
      const updatedUser = { ...originalUser, fullName: 'Updated User', enabled: true, role: { name: roleNameForBasicUsers } };

      req.params = { id: '123' };
      req.body = { fullName: 'Updated User', roleName: roleNameForBasicUsers, enabled: true, currentUser: superAdminMock };

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(originalUser),
      });

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      });

      await updateUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('123');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('123', updatedUser, { new: true });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
    });

    it('should return 200 when updating admin user', async () => {
      const originalUser = { fullName: 'Test User', email: 'test@example.com', password: 'hashedPassword', role: { name: roleNameForAdmins } };
      const updatedUser = { ...originalUser, fullName: 'Updated User', enabled: true, role: { name: roleNameForAdmins } };

      req.params = { id: '123' };
      req.body = { fullName: 'Updated User', roleName: roleNameForBasicUsers, enabled: true, currentUser: superAdminMock };

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(originalUser),
      });

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      });

      await updateUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('123');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('123', updatedUser, { new: true });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
    });

    it('should return 403 when trying to update super admin user', async () => {
      const originalUser = { fullName: 'Test User', email: 'test@example.com', password: 'hashedPassword', role: { name: roleNameForSuperAdmins } };

      req.params = { id: '123' };
      req.body = { fullName: 'Updated User', role: roleNameForBasicUsers, enabled: true, currentUser: adminMock };

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(originalUser),
      });

      await updateUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should return 200 and delete basic level user', async () => {
      req.params = { id: '123' };
      req.body.currentUser = superAdminMock;

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ _id: '123', email: 'test@example.com', role: { name: roleNameForBasicUsers } }),
      });

      (User.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: '123' });

      await deleteUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('123');
      expect(User.findByIdAndDelete).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User with id "123" deleted!' });
    });

    it('should return 200 and delete admin user', async () => {
      req.params = { id: '123' };
      req.body.currentUser = superAdminMock;

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ _id: '123', email: 'test@example.com', role: { name: roleNameForAdmins } }),
      });

      (User.findByIdAndDelete as jest.Mock).mockResolvedValue({ _id: '123' });

      await deleteUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('123');
      expect(User.findByIdAndDelete).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User with id "123" deleted!' });
    });

    it('should return 403 when trying to delete another super admin', async () => {
      req.params = { id: '19' };
      req.body.currentUser = superAdminMock;

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ _id: '19', email: 'test@example.com', role: { name: roleNameForSuperAdmins } }),
      });

      await deleteUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('19');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You are not allowed to access this resource!' });
    });

    it('should return 403 when trying to delete themselves', async () => {
      req.params = { id: superAdminMock._id };
      req.body.currentUser = superAdminMock;

      await deleteUser(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: "You can't delete yourself!" });
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
      const user = { ...superAdminMock, fullName: 'My Updated Name' };

      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(user);

      req.body = { fullName: 'Test User', email: 'test@example.com', currentUser: superAdminMock };

      await updateMyself(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ data: user });
    });
  });

  describe('enableUser', () => {
    it('should return 500 when error occurs', async () => {
      req.params = { id: '19' };
      req.body.currentUser = superAdminMock;

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(new Error('Test Error')),
      });

      await enableUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('19');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });

    it('should return 200 when basic user is being enabled', async () => {
      req.params = { id: '19' };
      req.body.currentUser = superAdminMock;

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ ...userMock, enabled: false }),
      });

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...userMock, enabled: true }),
      });

      await enableUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('19');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('19', { ...userMock, enabled: true }, { new: true });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User with id "19" enabled!' });
    });

    it('should return 403 when trying to enable admin', async () => {
      req.params = { id: '19' };
      req.body.currentUser = superAdminMock;

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ ...adminMock, enabled: false }),
      });

      await enableUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('19');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You have no access to this resource!' });
    });

    it('should return 403 when trying to enable superadmin', async () => {
      req.params = { id: '19' };
      req.body.currentUser = superAdminMock;

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ ...superAdminMock, enabled: false }),
      });

      await enableUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('19');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You have no access to this resource!' });
    });

    it('should return 404 when user is not found', async () => {
      req.params = { id: '19' };
      req.body.currentUser = superAdminMock;

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await enableUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('19');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User with id "19" not found!' });
    });
  });

  describe('disableUser', () => {
    it('should return 500 when error occurs', async () => {
      req.params = { id: '19' };
      req.body.currentUser = superAdminMock;

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(new Error('Test Error')),
      });

      await disableUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('19');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });

    it('should return 200 when user is being disabled', async () => {
      req.params = { id: '19' };
      req.body.currentUser = superAdminMock;

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ ...userMock, enabled: true }),
      });

      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...userMock, enabled: false }),
      });

      await disableUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('19');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('19', { ...userMock, enabled: false }, { new: true });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User with id "19" disabled!' });
    });

    it('should return 403 when trying to disable admin', async () => {
      req.params = { id: '19' };
      req.body.currentUser = superAdminMock;

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ ...adminMock, enabled: true }),
      });

      await enableUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('19');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You have no access to this resource!' });
    });

    it('should return 403 when trying to disable superadmin', async () => {
      req.params = { id: '19' };
      req.body.currentUser = superAdminMock;

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ ...superAdminMock, enabled: true }),
      });

      await enableUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('19');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You have no access to this resource!' });
    });

    it('should return 404 when user is not found', async () => {
      req.params = { id: '19' };
      req.body.currentUser = superAdminMock;

      (User.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await disableUser(req as Request, res as Response);

      expect(User.findById).toHaveBeenCalledWith('19');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User with id "19" not found!' });
    });
  });
});
