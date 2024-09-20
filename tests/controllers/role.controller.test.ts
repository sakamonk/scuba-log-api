import { Request, Response } from 'express';
import { Role } from '../../src/models/role.model';
import { createRole, getAllRoles, getRole, updateRole, deleteRole } from '../../src/controllers/role.controller';
import { setupTestEnvironment } from '../helpers/mock-test-setup';

jest.mock('../../src/models/role.model');

let req: Partial<Request>;
let res: Partial<Response>;
let jsonMock: jest.Mock;

const initTestEnvironment = setupTestEnvironment();

const roleMock = { _id: 'role_id_mock', name: 'role_mock', description: 'Mocked role for tests' };

describe('Role Controller', () => {
  beforeEach(() => {
    const environment = initTestEnvironment();

    req = environment.req as Partial<Request>;
    res = environment.res as Partial<Response>;
    jsonMock = environment.jsonMock as jest.Mock;

    req.body = {
      name: 'Test role',
      description: 'A role for test purposes',
    } as Partial<Request>;
  });

  describe('createRole', () => {
    it('should create a new role and return 201', async () => {
      (Role.create as jest.Mock).mockResolvedValue(roleMock);

      // Call the createRole controller
      await createRole(req as Request, res as Response);

      // Assert that Role.create was called with the correct params
      expect(Role.create).toHaveBeenCalledWith({
        name: 'Test role',
        description: 'A role for test purposes',
      });

      expect(Role.findOne).toHaveBeenCalledWith({ name: 'Test role' });
      expect(Role.create).toHaveBeenCalledWith({ name: 'Test role', description: 'A role for test purposes' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ data: roleMock });
    });

    it('should return 422 when name or description is missing', async () => {
      req.body = { name: '' };

      await createRole(req as Request, res as Response);

      expect(Role.findOne).not.toHaveBeenCalled();
      expect(Role.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'The fields name and description are mandatory!',
      });
    });

    it('should respond with 409 when role with the same name already exists', async () => {
      const updatedRole = { ...roleMock, description: 'Updated role description' };

      (Role.findOne as jest.Mock).mockResolvedValue(updatedRole);

      await createRole(req as Request, res as Response);

      expect(Role.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Role with name "Test role" already exists!' });
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles and respond with 200', async () => {
      const roles = [roleMock];

      (Role.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(roles),
        }),
      });

      await getAllRoles(req as Request, res as Response);

      expect(Role.find).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ data: roles });
    });
  });

  describe('getRole', () => {
    beforeEach(() => {
      req = {
        params: {
          id: '111',
        },
      } as Partial<Request>;
    });

    it('should return the role and respond with 200', async () => {
      (Role.findById as jest.Mock).mockResolvedValue(roleMock);

      await getRole(req as Request, res as Response);

      expect(Role.findById).toHaveBeenCalledWith('111');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ data: roleMock });
    });

    it('should respond with 404 when role is not found', async () => {
      (Role.findById as jest.Mock).mockResolvedValue(null);

      await getRole(req as Request, res as Response);

      expect(Role.findById).toHaveBeenCalledWith('111');

      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Role with id "111" not found!' });
    });

    it('should handle errors from Role.findOne and respond with 500', async () => {
      (Role.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await getRole(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });
  });

  describe('deleteRole', () => {
    beforeEach(() => {
      req = {
        params: {
          id: '111',
        },
      } as Partial<Request>;
    });

    it('should delete the role and respond with 200', async () => {
      (Role.findByIdAndDelete as jest.Mock).mockResolvedValue(roleMock);

      await deleteRole(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Role with id "111" deleted!' });
    });

    it('should respond with 404 when role is nout found', async () => {
      (Role.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await deleteRole(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Role with id "111" not found!' });
    });

    it('should handle errors from Role.findOne and respond with 500', async () => {
      (Role.findByIdAndDelete as jest.Mock).mockRejectedValue(new Error('Database error'));

      await deleteRole(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal Server Error.' });
    });
  });

  describe('updateRole', () => {
    beforeEach(() => {
      req = {
        params: {
          id: '111',
        },
        body: {
          name: roleMock.name,
          description: 'Updated role description',
        },
      } as Partial<Request>;
    });

    it('should update the role and respond with 200', async () => {
      const updatedRole = { ...roleMock, description: 'Updated role description' };

      (Role.findOne as jest.Mock).mockResolvedValue(null);
      (Role.findByIdAndUpdate as jest.Mock).mockResolvedValue(roleMock);
      (Role.findById as jest.Mock).mockResolvedValue(updatedRole);

      await updateRole(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ data: updatedRole });
    });

    it('should respond with 404 when role is not found', async () => {
      (Role.findOne as jest.Mock).mockResolvedValue(null);
      (Role.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await updateRole(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Role with id "111" not found!' });
    });

    it('should return 422 when name or description is missing', async () => {
      req.body = {};

      await updateRole(req as Request, res as Response);

      expect(Role.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'The field description is mandatory!',
      });
    });

    it('should handle errors from Role.findOne and respond with 500', async () => {
      (Role.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error('Database error'));

      await updateRole(req as Request, res as Response);

      expect(Role.findByIdAndUpdate).toHaveBeenCalledWith('111', { description: 'Updated role description' });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal Server Error.' });
    });
  });
});
