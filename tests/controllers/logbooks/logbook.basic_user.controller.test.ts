import { Request, Response } from 'express';
import { createLog, deleteLog, getAllLogs, getLog, updateLog } from '../../../src/controllers/logbook.controller';
import { DiveLog } from '../../../src/models/dive.log.model';
import { roleNameForBasicUsers, roleNameForAdmins, roleNameForSuperAdmins } from '../../../src/utils/role.helper';
import { setupTestEnvironment } from '../../helpers/mock-test-setup';

jest.mock('../../../src/models/dive.log.model');

let req: Partial<Request>;
let res: Partial<Response>;
let jsonMock: jest.Mock;

const initTestEnvironment = setupTestEnvironment();

const userMock = { _id: 'user_id_mock', role: { _id: 'role_bu', name: roleNameForBasicUsers } };
const userMock2 = { _id: 'user_id_mock2', role: { _id: 'role_bu', name: roleNameForBasicUsers } };
const adminMock = { _id: 'admin_id_mock', role: { _id: 'role_ad', name: roleNameForAdmins } };
const superAdminMock = { _id: 'super_admin_id_mock', role: { _id: 'role_sa', name: roleNameForSuperAdmins } };

describe('Logbook Controller for Basic Users', () => {
  beforeEach(() => {
    const environment = initTestEnvironment();

    req = environment.req as Partial<Request>;
    res = environment.res as Partial<Response>;
    jsonMock = environment.jsonMock as jest.Mock;
  });

  describe('createLog', () => {
    it('should return 422 if required fields are missing', async () => {
      req.body = { startTime: '', endTime: '', maxDepth: '', location: '' };

      await createLog(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'The fields startTime, endTime, maxDepth and location are mandatory!' });
    });

    it('should create a new dive log and return 201', async () => {
      req.body = {
        startTime: '2024-01-01T10:00:00',
        endTime: '2024-01-01T11:00:00',
        maxDepth: 30,
        location: 'Coral Reef',
        currentUser: userMock,
      };

      const callParams = {
        startTime: '2024-01-01T10:00:00',
        endTime: '2024-01-01T11:00:00',
        maxDepth: 30,
        location: 'Coral Reef',
        user: userMock,
        additionalInfo: undefined,
        airTemperature: undefined,
        avgDepth: undefined,
        tankEndPressure: undefined,
        tankMaterial: undefined,
        tankStartPressure: undefined,
        tankVolume: undefined,
        visibility: undefined,
        waterBody: undefined,
        waterTemperature: undefined,
      };

      const createdLog = {
        _id: 'log_id_1122',
        ...req.body,
      };

      (DiveLog.create as jest.Mock).mockResolvedValue(createdLog);

      await createLog(req as Request, res as Response);

      expect(DiveLog.create).toHaveBeenCalledWith({ ...callParams, user: 'user_id_mock' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({ data: createdLog });
    });

    it('should return 500 in case of error occurs', async () => {
      req.body = {
        startTime: '2024-01-01T10:00:00',
        endTime: '2024-01-01T11:00:00',
        maxDepth: 30,
        location: 'Coral Reef',
        currentUser: userMock,
      };

      (DiveLog.create as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Test Error');
      });

      await createLog(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });
  });

  describe('getAllLogs', () => {
    it('should return only their own logs and respond with 200', async () => {
      req.body.currentUser = userMock;

      const logs = [
        { _id: 'log_id_1', location: 'Coral Reef', startTime: '2024-01-01T10:00:00', user: userMock },
        { _id: 'log_id_2', location: 'Deep Sea', startTime: '2024-02-01T10:00:00', user: userMock },
        { _id: 'log_id_3', location: 'Deep Sea', startTime: '2024-02-01T10:00:00', user: userMock },
        { _id: 'log_id_4', location: 'Deep Sea', startTime: '2024-02-01T10:00:00', user: userMock2 },
        { _id: 'log_id_5', location: 'Deep Sea', startTime: '2024-02-01T10:00:00', user: userMock2 },
      ];

      (DiveLog.find as jest.Mock).mockImplementation(() => {
        const userLogs = logs.filter((log) => log.user._id === userMock._id);

        return {
          sort: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(userLogs),
        };
      });

      await getAllLogs(req as Request, res as Response);

      expect(DiveLog.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ data: logs.slice(0, 3) });
    });

    it('should return 500 in case of error occurs', async () => {
      req.body.currentUser = userMock;

      (DiveLog.find as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Test Error');
      });

      await getAllLogs(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });

    describe('Filtering logs based on query parameters', () => {
      const logs = [
        { _id: 'log_id_1', location: 'Coral Reef', startTime: '2024-02-02T10:30:00' },
        { _id: 'log_id_2', location: 'Deep Sea', startTime: '2024-02-02T10:00:00' },
        { _id: 'log_id_3', location: 'Coral Sea', startTime: '2024-02-01T13:00:00' },
        { _id: 'log_id_4', location: 'Baltic Sea', startTime: '2024-02-01T12:00:00' },
        { _id: 'log_id_5', location: 'Deep Sea', startTime: '2024-02-01T11:00:00' },
        { _id: 'log_id_6', location: 'Baltic Sea', startTime: '2024-02-01T10:00:00' },
      ];

      it('should return return max amount of logs and respond with 200', async () => {
        req.body.currentUser = userMock;
        req.query = { maxAmount: '3' };

        (DiveLog.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockImplementation((limitValue) => {
            return { exec: jest.fn().mockResolvedValue(logs.slice(0, limitValue)) };
          }),
          exec: jest.fn().mockResolvedValue(logs),
        });

        await getAllLogs(req as Request, res as Response);

        expect(DiveLog.find).toHaveBeenCalledWith({ user: 'user_id_mock' }, {});
        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({ data: logs.slice(0, 3) });
      });

      it('should return logs sorted by start time in ascending order and respond with 200', async () => {
        req.body.currentUser = userMock;
        req.query = { sortBy: 'startTime', sortOrder: 'asc' };

        (DiveLog.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockImplementation(() => {
            return { exec: jest.fn().mockResolvedValue(logs.sort((a, b) => a.startTime.localeCompare(b.startTime))) };
          }),
          exec: jest.fn().mockResolvedValue(logs),
        });

        await getAllLogs(req as Request, res as Response);

        expect(DiveLog.find).toHaveBeenCalledWith({ user: 'user_id_mock' }, {});
        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          data: logs.sort((a, b) => a.startTime.localeCompare(b.startTime)),
        });
      });

      it('should return 422 for invalid tsStart format', async () => {
        req.body.currentUser = userMock;
        req.query = { tsStart: '2024-33-12' };

        await getAllLogs(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid tsStart format. Please provide a valid datetime string.' });
      });

      it('should return 422 for invalid tsEnd format', async () => {
        req.body.currentUser = userMock;
        req.query = { tsStart: '2024-1-1', tsEnd: '2024-33-12' };

        await getAllLogs(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid tsEnd format. Please provide a valid datetime string.' });
      });

      it('should return logs filtered by start time and respond with 200', async () => {
        req.body.currentUser = userMock;
        req.query = { tsStart: '2024-02-02T00:00:00' };

        const tsStart = new Date(req.query.tsStart as string);

        (DiveLog.find as jest.Mock).mockImplementation(() => {
          const filteredLogs = logs.filter((log) => new Date(log.startTime) >= tsStart);

          return {
            sort: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(filteredLogs),
          };
        });

        await getAllLogs(req as Request, res as Response);

        expect(DiveLog.find).toHaveBeenCalledWith(
          { user: 'user_id_mock' },
          expect.objectContaining({
            startTime: { $gte: tsStart },
          }),
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          data: logs.filter((log) => new Date(log.startTime) >= tsStart),
        });
      });

      it('should return logs filtered by end time and respond with 200', async () => {
        req.body.currentUser = userMock;
        req.query = { tsEnd: '2024-02-02T00:00:00' };

        const tsEnd = new Date(req.query.tsEnd as string);

        (DiveLog.find as jest.Mock).mockImplementation(() => {
          const filteredLogs = logs.filter((log) => new Date(log.startTime) <= tsEnd);

          return {
            sort: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(filteredLogs),
          };
        });

        await getAllLogs(req as Request, res as Response);

        expect(DiveLog.find).toHaveBeenCalledWith(
          { user: 'user_id_mock' },
          expect.objectContaining({
            startTime: { $lte: tsEnd },
          }),
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          data: logs.filter((log) => new Date(log.startTime) <= tsEnd),
        });
      });

      it('should return logs filtered by both start and end time and respond with 200', async () => {
        req.body.currentUser = userMock;
        req.query = {
          tsStart: '2024-02-01T12:30:00',
          tsEnd: '2024-02-01T20:00:00',
        };

        const tsStart = new Date(req.query.tsStart as string);
        const tsEnd = new Date(req.query.tsEnd as string);

        (DiveLog.find as jest.Mock).mockImplementation(() => {
          const filteredLogs = logs.filter((log) => new Date(log.startTime) >= tsStart && new Date(log.startTime) <= tsEnd);

          return {
            sort: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(filteredLogs),
          };
        });

        await getAllLogs(req as Request, res as Response);

        expect(DiveLog.find).toHaveBeenCalledWith(
          { user: 'user_id_mock' },
          expect.objectContaining({
            startTime: { $gte: tsStart, $lte: tsEnd },
          }),
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          data: logs.filter((log) => new Date(log.startTime) >= tsStart && new Date(log.startTime) <= tsEnd),
        });
      });

      it('should return logs sorted by location asc and respond with 200', async () => {
        req.body.currentUser = userMock;
        req.query = {
          sortBy: 'location',
          sortOrder: 'asc',
        };

        (DiveLog.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(
            logs.sort((a, b) => {
              if (a.location < b.location) {
                return -1;
              }
              if (a.location > b.location) {
                return 1;
              }
              return 0;
            }),
          ),
        });

        await getAllLogs(req as Request, res as Response);

        expect(DiveLog.find).toHaveBeenCalledWith({ user: 'user_id_mock' }, {});
        expect(DiveLog.find().sort).toHaveBeenCalledWith({ location: 1 });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
          data: logs.sort((a, b) => (a.location < b.location ? -1 : 1)),
        });
      });
    });
  });

  describe('getLog', () => {
    it('should return 404 if the log is not found', async () => {
      req.params = { id: 'log_id_1122' };
      req.body.currentUser = userMock;

      (DiveLog.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        role: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await getLog(req as Request, res as Response);

      expect(DiveLog.findById).toHaveBeenCalledWith('log_id_1122');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Dive log with id "log_id_1122" not found!' });
    });

    it('should return 500 in case of error occurs', async () => {
      req.params = { id: 'log_id_1122' };
      req.body.currentUser = userMock;

      (DiveLog.findById as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Test Error');
      });

      await getLog(req as Request, res as Response);

      expect(DiveLog.findById).toHaveBeenCalledWith('log_id_1122');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal Server Error' });
    });

    it('should return the dive log and respond with 200', async () => {
      req.params = { id: 'log_id_1122' };
      req.body.currentUser = userMock;

      const log = { _id: 'log_id_1122', location: 'Coral Reef', startTime: '2024-01-01T10:00:00', user: userMock };

      (DiveLog.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        role: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(log),
      });

      await getLog(req as Request, res as Response);

      expect(DiveLog.findById).toHaveBeenCalledWith('log_id_1122');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ data: log });
    });

    it('should return 403 if the log belongs to another basic user', async () => {
      req.params = { id: 'log_id_1122' };
      req.body.currentUser = userMock;

      const log = { _id: 'log_id_1122', location: 'Coral Reef', startTime: '2024-01-01T10:00:00', user: userMock2 };

      (DiveLog.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        role: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(log),
      });

      await getLog(req as Request, res as Response);

      expect(DiveLog.findById).toHaveBeenCalledWith('log_id_1122');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You are not allowed to access this resource!' });
    });

    it('should return 403 if the log belongs to admin user', async () => {
      req.params = { id: 'log_id_1122' };
      req.body.currentUser = userMock;

      const log = { _id: 'log_id_1122', location: 'Coral Reef', startTime: '2024-01-01T10:00:00', user: adminMock };

      (DiveLog.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        role: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(log),
      });

      await getLog(req as Request, res as Response);

      expect(DiveLog.findById).toHaveBeenCalledWith('log_id_1122');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You are not allowed to access this resource!' });
    });

    it('should return 403 if the log belongs to superadmin user', async () => {
      req.params = { id: 'log_id_1122' };
      req.body.currentUser = userMock;

      const log = { _id: 'log_id_1122', location: 'Coral Reef', startTime: '2024-01-01T10:00:00', user: superAdminMock };

      (DiveLog.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        role: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(log),
      });

      await getLog(req as Request, res as Response);

      expect(DiveLog.findById).toHaveBeenCalledWith('log_id_1122');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You are not allowed to access this resource!' });
    });

    it('should return 403 if the log belongs to deleted user', async () => {
      req.params = { id: 'log_id_1122' };
      req.body.currentUser = userMock;

      const log = { _id: 'log_id_1122', location: 'Coral Reef', startTime: '2024-01-01T10:00:00', user: null };

      (DiveLog.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        role: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(log),
      });

      await getLog(req as Request, res as Response);

      expect(DiveLog.findById).toHaveBeenCalledWith('log_id_1122');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You are not allowed to access this resource!' });
    });
  });

  describe('updateLog', () => {
    it('should return 404 if the log is not found', async () => {
      req.params = { id: 'log_id_1122' };
      req.body = { startTime: new Date(), endTime: new Date(), maxDepth: '20', location: 'Baltic Sea' };
      req.body.currentUser = userMock;

      (DiveLog.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await updateLog(req as Request, res as Response);

      expect(DiveLog.findById).toHaveBeenCalledWith('log_id_1122');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Dive log with id "log_id_1122" not found!' });
    });

    it('should return 500 in case of error occurs', async () => {
      req.params = { id: 'log_id_1122' };
      req.body = { startTime: new Date(), endTime: new Date(), maxDepth: '20', location: 'Baltic Sea' };
      req.body.currentUser = userMock;

      (DiveLog.findById as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Test Error');
      });

      await updateLog(req as Request, res as Response);

      expect(DiveLog.findById).toHaveBeenCalledWith('log_id_1122');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal Server Error.' });
    });

    it('should return 422 if required fields are missing', async () => {
      const log = { _id: 'log_id_1122', startTime: '2024-01-01T10:00:00', endTime: '2024-01-01T11:00:00', maxDepth: 13, location: 'Lake Päijänne' };

      (DiveLog.findOne as jest.Mock).mockResolvedValue(log);

      req.body = { location: '' };

      await updateLog(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'The fields startTime, endTime, maxDepth and location are mandatory!' });
    });

    it("should return 403 if trying to update other user's log", async () => {
      const currentDate: Date = new Date();
      const pastDate: Date = new Date(currentDate.getTime() - 1000 * 60 * 60 * 2);
      const mockDiveLog = { _id: 'log_id_1122', startTime: pastDate, endTime: currentDate, maxDepth: 13, location: 'Lake Päijänne', user: userMock2 };

      req.params = { id: 'log_id_1122' };
      req.body = { ...mockDiveLog, currentUser: userMock };

      (DiveLog.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDiveLog),
      });

      await updateLog(req as Request, res as Response);

      expect(DiveLog.findById).toHaveBeenCalledWith('log_id_1122');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You are not allowed to access this resource!' });
    });

    it('should update the dive log and return 200', async () => {
      const currentDate: Date = new Date();
      const pastDate: Date = new Date(currentDate.getTime() - 1000 * 60 * 60 * 2);
      const mockDiveLog = { _id: 'log_id_1122', startTime: pastDate, endTime: currentDate, maxDepth: 13, location: 'Lake Päijänne', user: userMock };
      const updatedDiveLog = { ...mockDiveLog, startTime: pastDate, endTime: currentDate, location: 'Baltic sea', maxDepth: 20, user: userMock };

      req.params = { id: 'log_id_1122' };
      req.body = { ...mockDiveLog, currentUser: userMock };

      (DiveLog.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDiveLog),
      });

      await updateLog(req as Request, res as Response);

      (DiveLog.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedDiveLog),
      });

      await updateLog(req as Request, res as Response);

      expect(DiveLog.findById).toHaveBeenCalledWith('log_id_1122');
      expect(DiveLog.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
    });
  });

  describe('deleteLog', () => {
    it('should delete the dive log and return 200', async () => {
      req.params = { id: 'log_id_1122' };
      req.body.currentUser = userMock;

      const mockDiveLog = { _id: 'log_id_1122', user: userMock };

      (DiveLog.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDiveLog),
      });

      (DiveLog.findByIdAndDelete as jest.Mock).mockResolvedValue(mockDiveLog);

      await deleteLog(req as Request, res as Response);

      expect(DiveLog.findById).toHaveBeenCalledWith('log_id_1122');
      expect(DiveLog.findByIdAndDelete).toHaveBeenCalledWith('log_id_1122');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Dive log with id "log_id_1122" deleted!' });
    });

    it("should return 403 if trying to delete other user's log", async () => {
      req.params = { id: 'log_id_1122' };
      req.body.currentUser = userMock;

      const mockDiveLog = { _id: 'log_id_1122', user: userMock2 };

      (DiveLog.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDiveLog),
      });

      await deleteLog(req as Request, res as Response);

      expect(DiveLog.findById).toHaveBeenCalledWith('log_id_1122');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'You are not allowed to access this resource!' });
    });

    it('should return 404 if the log is not found', async () => {
      req.params = { id: 'log_id_1122' };
      req.body.currentUser = userMock;

      (DiveLog.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await deleteLog(req as Request, res as Response);

      expect(DiveLog.findById).toHaveBeenCalledWith('log_id_1122');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Dive log with id "log_id_1122" not found!' });
    });

    it('should return 404 if the log is not found the second time', async () => {
      req.params = { id: 'log_id_1122' };
      req.body.currentUser = userMock;

      const mockDiveLog = { _id: 'log_id_1122', user: userMock };

      (DiveLog.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDiveLog),
      });

      (DiveLog.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await deleteLog(req as Request, res as Response);

      expect(DiveLog.findById).toHaveBeenCalledWith('log_id_1122');
      expect(DiveLog.findByIdAndDelete).toHaveBeenCalledWith('log_id_1122');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Dive log with id "log_id_1122" not found!' });
    });

    it('should return 500 in case of error occurs', async () => {
      req.params = { id: 'log_id_1122' };
      req.body.currentUser = userMock;

      (DiveLog.findById as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Test Error');
      });

      await deleteLog(req as Request, res as Response);

      expect(DiveLog.findById).toHaveBeenCalledWith('log_id_1122');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal Server Error.' });
    });
  });
});
