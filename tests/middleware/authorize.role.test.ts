import { Request, Response, NextFunction } from 'express';
import { authorizeAdmin, authorizeSuperAdmin } from '../../src/middleware/authorize.role';
import { roleNameForAdmins, roleNameForBasicUsers, roleNameForSuperAdmins } from '../../src/utils/role.helper';
import { setupTestEnvironment } from '../helpers/mock-test-setup';
import { UserInput } from '../../src/models/user.model';
import { RoleInput } from '../../src/models/role.model';

let req: Partial<Request>;
let res: Partial<Response>;
let next: NextFunction;
let jsonMock: jest.Mock;
let userMock: Partial<UserInput>;
let roleMock: Partial<RoleInput>;

const initTestEnvironment = setupTestEnvironment();

describe('Authorization Middleware', () => {
  beforeEach(() => {
    const environment = initTestEnvironment();

    req = environment.req as Partial<Request>;
    res = environment.res as Partial<Response>;
    next = environment.next as NextFunction;
    jsonMock = environment.jsonMock as jest.Mock;
    roleMock = { name: roleNameForBasicUsers } as Partial<RoleInput>;
    userMock = { email: 'test@example.com', fullName: 'Test User', role: roleMock } as Partial<UserInput>;
  });

  describe('authorizeAdmin Middleware', () => {
    it('should return 401 if no user is provided', async () => {
      await authorizeAdmin(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized!' });
    });

    it('should return 403 if user is not an admin', async () => {
      req.body.currentUser = userMock;

      await authorizeAdmin(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Forbidden!' });
    });

    it('should call next() if user is an admin', async () => {
      roleMock.name = roleNameForAdmins;
      req.body.currentUser = userMock;

      await authorizeAdmin(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('authorizeSuperAdmin Middleware', () => {
    it('should return 401 if no user is provided', async () => {
      req.body.currentUser = null;

      await authorizeSuperAdmin(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized!' });
    });

    it('should return 403 if user is not a super admin', async () => {
      roleMock.name = roleNameForAdmins;
      req.body.currentUser = userMock;

      await authorizeSuperAdmin(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Forbidden!' });
    });

    it('should call next() if user is a super admin', async () => {
      roleMock.name = roleNameForSuperAdmins;
      req.body.currentUser = userMock;

      await authorizeSuperAdmin(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
