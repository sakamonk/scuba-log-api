import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DiveLog, DiveLogDocument, DiveLogInput } from '../models/dive.log.model';
import { isSuperAdmin, isAdmin, isBasicLevelUser } from '../utils/role.helper';
import { roleNameForAdmins, roleNameForSuperAdmins } from '../../src/utils/role.helper';
import { isUserAllowedToAccessLog } from '../../src/utils/dive.log.access.helper';
import { UserDocument } from 'src/models/user.model';

// Super admin can create log for any user
// Admin can create log for any basic user and for themselves
// Basic user can create log only for themselves
const createLog = async (req: Request, res: Response) => {
  const currentUser = req.body.currentUser as UserDocument;
  const {
    addUser,
    additionalInfo,
    airTemperature,
    avgDepth,
    endTime,
    location,
    maxDepth,
    startTime,
    tankEndPressure,
    tankMaterial,
    tankStartPressure,
    tankVolume,
    visibility,
    waterBody,
    waterTemperature,
  } = req.body;

  if (!startTime || !endTime || !maxDepth || !location) {
    return res.status(422).json({ message: 'The fields startTime, endTime, maxDepth and location are mandatory!' });
  }

  let logForUser = currentUser as UserDocument; // Default to the current user

  // Super admin can create log for any user
  if (isSuperAdmin(currentUser) && addUser) {
    logForUser = addUser;
  }
  // Admin can create log for any basic user and for themselves
  else if (isAdmin(currentUser) && addUser) {
    if (addUser.role.name == roleNameForSuperAdmins || (addUser.role.name == roleNameForAdmins && addUser._id !== currentUser._id)) {
      return res.status(403).json({ message: 'You are not allowed to create a log for this user.' });
    }

    logForUser = addUser as UserDocument;
  }

  // check validation errors
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const diveLogInput: DiveLogInput = {
    startTime,
    endTime,
    maxDepth,
    avgDepth,
    waterTemperature,
    airTemperature,
    tankMaterial,
    tankVolume,
    tankStartPressure,
    tankEndPressure,
    waterBody,
    location,
    visibility,
    additionalInfo,
    user: logForUser._id,
  };

  try {
    const logCreated = (await DiveLog.create(diveLogInput)) as DiveLogDocument;

    return res.status(201).json({ data: logCreated });
  } catch (err) {
    console.log(`createLog Error: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Super admin sees all logs
// Admin sees any admin and basic user logs
// Basic user sees only their personal logs
const getAllLogs = async (req: Request, res: Response) => {
  const currentUser = req.body.currentUser as UserDocument;
  const { activeUsersOnly = true, maxAmount, sortBy = 'createdAt', sortOrder = 'desc', tsEnd, tsStart } = req.query; // Filtering parameters

  // Build the filter object
  const filter: any = {};

  // Validate and filter by dive started timestamp (log's startTime between tsStart and tsEnd)
  let parsedTime: Date;

  if (tsStart) {
    parsedTime = new Date(tsStart as string);

    if (isNaN(parsedTime.getTime())) {
      return res.status(422).json({ message: 'Invalid tsStart format. Please provide a valid datetime string.' });
    }

    filter.startTime = { $gte: new Date(tsStart as string) };
  }
  if (tsEnd) {
    parsedTime = new Date(tsEnd as string);

    if (isNaN(parsedTime.getTime())) {
      return res.status(422).json({ message: 'Invalid tsEnd format. Please provide a valid datetime string.' });
    }

    if (!filter.startTime) {
      filter.startTime = {};
    }
    filter.startTime.$lte = new Date(tsEnd as string);
  }

  const filterOnlyActiveUsers = activeUsersOnly === 'true' || activeUsersOnly === true;

  try {
    // Build the query
    let logsQuery;

    // Basic users can see only their own logs
    if (isBasicLevelUser(currentUser)) {
      logsQuery = DiveLog.find({ user: currentUser._id }, filter);

      // Populate user and role, needed when filtering by role
    } else {
      logsQuery = DiveLog.find(filter).populate({
        path: 'user',
        populate: {
          path: 'role',
        },
      });
    }

    // Sort the results
    const sortOption: any = {};

    sortOption[sortBy as string] = sortOrder === 'asc' ? 1 : -1; // 1=asc, -1=desc
    logsQuery.sort(sortOption);

    // Limit the results
    if (maxAmount) {
      logsQuery = logsQuery.limit(Number(maxAmount));
    }

    // Execute the query
    const logs = await logsQuery.exec();

    if (isSuperAdmin(currentUser) && filterOnlyActiveUsers === true) {
      const filteredLogs = logs.filter((log) => {
        if (log?.user === null) {
          return false;
        }
        return log?.user && log?.user?.enabled === true;
      });

      return res.status(200).json({ data: filteredLogs });
    }

    // Admin can see only basic user logs, their own logs, so filter them out
    if (isAdmin(currentUser)) {
      const filteredLogs = logs.filter((log) => {
        const logUserId = log?.user == null ? '-' : log?.user['_id'];
        const currentUserLog = currentUser._id.toString() === logUserId.toString();

        if (filterOnlyActiveUsers === true && (log?.user === null || log?.user?.enabled === false)) {
          return false;
        }

        return isBasicLevelUser(log?.user) || currentUserLog;
      });

      return res.status(200).json({ data: filteredLogs });
    }

    return res.status(200).json({ data: logs });
  } catch (err) {
    console.log(`getAllLogs Error: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Super admin can get any log
// Admin can get any admin and basic user logs
// Basic user can get only their own logs
const getLog = async (req: Request, res: Response) => {
  const currentUser = req.body.currentUser as UserDocument;
  const { id } = req.params;

  try {
    const log = (await DiveLog.findById(id).populate('user').exec()) as DiveLogDocument;

    if (!log) {
      return res.status(404).json({ message: `Dive log with id "${id}" not found!` });
    }

    if (!isUserAllowedToAccessLog(currentUser, log)) {
      return res.status(403).json({ message: 'You are not allowed to access this resource!' });
    }

    return res.status(200).json({ data: log });
  } catch (err) {
    console.log(`getLog Error: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Super admin can update any log
// Admin can update only basic user logs and their own logs
// Basic user can update only their own logs
const updateLog = async (req: Request, res: Response) => {
  const currentUser = req.body.currentUser as UserDocument;
  const { id } = req.params;
  const {
    additionalInfo,
    airTemperature,
    avgDepth,
    endTime,
    location,
    maxDepth,
    startTime,
    tankEndPressure,
    tankMaterial,
    tankStartPressure,
    tankVolume,
    visibility,
    waterBody,
    waterTemperature,
  } = req.body;

  if (!startTime || !endTime || !maxDepth || !location) {
    return res.status(422).json({ message: 'The fields startTime, endTime, maxDepth and location are mandatory!' });
  }

  const updateData: DiveLogInput = {
    startTime,
    endTime,
    maxDepth,
    avgDepth,
    waterTemperature,
    airTemperature,
    tankMaterial,
    tankVolume,
    tankStartPressure,
    tankEndPressure,
    waterBody,
    location,
    visibility,
    additionalInfo,
  } as DiveLogInput;

  try {
    let log = await DiveLog.findById(id).populate('user').exec();

    if (!log) {
      return res.status(404).json({ message: `Dive log with id "${id}" not found!` });
    }

    if (!isUserAllowedToAccessLog(currentUser, log)) {
      return res.status(403).json({ message: 'You are not allowed to access this resource!' });
    }

    log = await DiveLog.findByIdAndUpdate(id, updateData, { new: true });
    return res.status(200).json({ data: log });
  } catch (err) {
    console.log(`updateLog Error: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

// Super admin can delete any log
// Admin can delete only basic user logs and their own logs
const deleteLog = async (req: Request, res: Response) => {
  const currentUser = req.body.currentUser as UserDocument;
  const { id } = req.params;

  try {
    const log = (await DiveLog.findById(id)
      .populate({
        path: 'user',
        populate: {
          path: 'role',
        },
      })
      .exec()) as DiveLogDocument;

    if (!log) {
      return res.status(404).json({ message: `Dive log with id "${id}" not found!` });
    }

    if (!isUserAllowedToAccessLog(currentUser, log)) {
      return res.status(403).json({ message: 'You are not allowed to access this resource!' });
    }

    const deletedLog = (await DiveLog.findByIdAndDelete(id)) as DiveLogDocument;

    if (deletedLog) {
      return res.status(200).json({ message: `Dive log with id "${deletedLog._id}" deleted!` });
    } else {
      return res.status(404).json({ message: `Dive log with id "${id}" not found!` });
    }
  } catch (err) {
    console.log(`deleteLog Error: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error.' });
  }
};

export { createLog, deleteLog, getAllLogs, getLog, updateLog };
