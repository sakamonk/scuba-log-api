import { Request, Response } from 'express';
import { User, UserDocument, UserInput } from '../models/user.model';
import { encryptPlainPassword } from '../utils/password.helper';
import { isSuperAdmin, isAdmin, isBasicLevelUser, isAdminLevelUser } from '../utils/role.helper';
import { roleNameForSuperAdmins, roleNameForAdmins, roleNameForBasicUsers } from '../utils/role.helper';
import { validationResult } from 'express-validator';
import { Role, RoleDocument } from '../models/role.model';

// Super admin can create user with any role
// Admin can create user only with basic user role
// Basic user can't create users
const createUser = async (req: Request, res: Response) => {
  const { email, fullName, password, roleName } = req.body;
  const currentUser = req.body.currentUser as UserDocument;
  const defaultRoleName = roleNameForBasicUsers;

  if (isBasicLevelUser(currentUser)) {
    return res.status(403).json({ error: 'You are not allowed to access this resource!' });
  }

  if (!email || !fullName || !password) {
    return res.status(422).json({ message: 'The fields email, fullName, and password are mandatory!' });
  }

  try {
    let useRoleName: string = defaultRoleName;

    // super admin can assign a role to the new user. The role must exist.
    if (isSuperAdmin(currentUser) && typeof roleName !== 'undefined') {
      useRoleName = roleName;
    }

    // check validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // Check if user already exists
    const user = (await User.findOne({ email })) as UserDocument;

    if (user?.email === email) {
      return res.status(400).json({ message: 'User with this email already exists!' });
    }

    const role = (await Role.findOne({ name: useRoleName })) as RoleDocument;

    if (!role) {
      return res.status(404).json({ message: `Role with name "${useRoleName}" not found!` });
    }

    const userInput: UserInput = {
      fullName,
      email,
      password: encryptPlainPassword(password),
      enabled: true,
      role: role._id,
    };

    const userCreated = (await User.create(userInput)) as UserDocument;

    userCreated.password = '[REDACTED]'; // Don't return the password in response
    return res.status(201).json({ data: userCreated });
  } catch (err) {
    console.log(`createUser Error: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Super admin sees all users
// Admin sees all basic users and their own account
// Basic user can't see anything
const getAllUsers = async (req: Request, res: Response) => {
  const currentUser = req.body.currentUser as UserDocument;
  const { activeUsersOnly = true, maxAmount, sortBy = 'createdAt', sortOrder = 'desc' } = req.query; // Filtering parameters

  try {
    if (isBasicLevelUser(currentUser)) {
      return res.status(403).json({ message: 'You are not allowed to access this resource!' });
    }

    const filterActiveUsersOnly: boolean = activeUsersOnly === 'true' || activeUsersOnly === true;

    // Build the query
    let usersQuery;

    // Super admins can see all users
    if (isSuperAdmin(currentUser)) {
      if (filterActiveUsersOnly) {
        usersQuery = User.find({ enabled: true });
      } else {
        usersQuery = User.find();
      }

      usersQuery = usersQuery.populate('role');

      // Admis can see only basic level users, so not even their own profile
    } else if (isAdmin(currentUser)) {
      if (filterActiveUsersOnly) {
        usersQuery = User.find({ enabled: true });
      } else {
        usersQuery = User.find();
      }

      usersQuery = usersQuery.populate({
        path: 'role',
        match: { name: { $nin: [roleNameForSuperAdmins, roleNameForAdmins] } },
      });
    }

    // Sort the results
    const sortOption: any = {};

    sortOption[sortBy as string] = sortOrder === 'asc' ? 1 : -1;
    usersQuery.sort(sortOption);

    // Limit the results
    if (maxAmount) {
      usersQuery = usersQuery.limit(Number(maxAmount));
    }

    const users = await usersQuery.exec();
    const filteredUsers = users.filter((user) => user?.role !== null);

    return res.status(200).json({ data: filteredUsers });
  } catch (err) {
    console.log(`getAllLogs Error: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Super admin can access any user
// Admin can access only basic users and their own user
// Basic user can access only their own user
const getUser = async (req: Request, res: Response) => {
  const currentUser = req.body.currentUser as UserDocument;
  const { id } = req.params;

  try {
    if (isBasicLevelUser(currentUser)) {
      return res.status(403).json({ message: 'You are not allowed to access this resource!' });
    }

    if (isAdmin(currentUser) && currentUser._id === id) {
      return res.status(403).json({ message: 'You are not allowed to access this resource!' });
    }

    const user = (await User.findById(id).populate('role').exec()) as UserDocument;

    if (!user) {
      return res.status(404).json({ message: `User with id "${id}" not found!` });
    }

    if (isAdmin(currentUser) && (isAdmin(user) || isSuperAdmin(user))) {
      return res.status(403).json({ message: 'You are not allowed to access this resource!' });
    }

    return res.status(200).json({ data: user });
  } catch (err) {
    console.log(`getUser Error: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Super admin can update any admin or basic user
// Admin can update only basic users
const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { enabled, fullName } = req.body;
  const currentUser = req.body.currentUser as UserDocument;

  if (isBasicLevelUser(currentUser)) {
    return res.status(403).json({ message: 'You are not allowed to access this resource!' });
  }

  if (!fullName) {
    return res.status(422).json({ message: 'The field fullName is mandatory!' });
  }

  try {
    const user = (await User.findById(id).populate('role').exec()) as UserDocument;

    if (!user) {
      return res.status(404).json({ message: `User with id "${id}" not found!` });
    }

    const userInput: UserInput = {
      fullName,
      role: user.role,
      enabled: user.enabled,
      email: user.email,
      password: user.password,
    };

    if (isSuperAdmin(currentUser) && isSuperAdmin(user)) {
      return res.status(403).json({ message: 'You are not allowed to access this resource!' });
    }

    if (isAdmin(currentUser) && isAdminLevelUser(user)) {
      return res.status(403).json({ message: 'You are not allowed to access this resource!' });
    }

    if (enabled) {
      userInput.enabled = enabled;
    }

    const updatedUser = (await User.findByIdAndUpdate(id, userInput, { new: true })) as UserDocument;

    return res.status(200).json({ data: updatedUser });
  } catch (err) {
    console.log(`updateUser Error: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Super admin can delete any admin or basic users
// Admin can delete only basic users
// Basic user can't delete any user
const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.body.currentUser as UserDocument;

  if (isBasicLevelUser(currentUser)) {
    return res.status(403).json({ message: 'You are not allowed to access this resource!' });
  }

  const deletingCurrentUser = currentUser._id.toString() === id.toString();

  if (deletingCurrentUser) {
    // User can't delete themselves
    return res.status(403).json({ message: "You can't delete yourself!" });
  }

  try {
    const user = (await User.findById(id).populate('role').exec()) as UserDocument;

    if (!user) {
      return res.status(404).json({ message: `User with id "${id}" not found!` });
    }

    // super admins can't delete other super admins
    if (isSuperAdmin(currentUser) && isSuperAdmin(user)) {
      return res.status(403).json({ message: 'You are not allowed to access this resource!' });
    }

    // admins can't delete other admins or super admins
    if (isAdmin(currentUser) && (isAdmin(user) || isSuperAdmin(user))) {
      return res.status(403).json({ message: 'You are not allowed to access this resource!' });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: `User with id "${id}" not found!` });
    }

    return res.status(200).json({ message: `User with id "${id}" deleted!` });
  } catch (err) {
    console.log(`deleteUser Error: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Any user can get their own profile regardless of their role
const getMyProfile = async (req: Request, res: Response) => {
  try {
    const currentUser = req.body.currentUser as UserDocument;

    return res.status(200).json({ data: currentUser });
  } catch (err) {
    console.log(`getMyProfile Error: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Any user can update their basic info regardless of their role
const updateMyself = async (req: Request, res: Response) => {
  const { email, fullName, password } = req.body;
  const currentUser = req.body.currentUser as UserDocument;

  if (!fullName && !email && !password) {
    return res.status(200).json({ message: 'Nothing changed!' });
  }

  try {
    const userInput: UserInput = {
      fullName: currentUser.fullName,
      email: currentUser.email,
      enabled: currentUser.enabled,
      password: currentUser.password,
      role: currentUser.role,
    };

    if (fullName) {
      userInput.fullName = fullName;
    }
    if (email) {
      userInput.email = email;
    }
    if (password) {
      userInput.password = encryptPlainPassword(password);
    }

    const updatedUser = await User.findByIdAndUpdate(currentUser._id, userInput, { new: true });

    return res.status(200).json({ data: updatedUser });
  } catch (err) {
    console.log(`updateMyself Error: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Superadmins can enable any admin or basic level user
// Admins can enable any basic level user
const enableUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.body.currentUser as UserDocument;

  if (isBasicLevelUser(currentUser)) {
    return res.status(403).json({ message: 'Forbidden!' });
  }

  try {
    const user = (await User.findById(id).populate('role').exec()) as UserDocument;

    if (!user) {
      return res.status(404).json({ message: `User with id "${id}" not found!` });
    }

    if (isSuperAdmin(user)) {
      return res.status(403).json({ message: 'You have no access to this resource!' });
    }

    if (isAdmin(currentUser) && !isBasicLevelUser(user)) {
      return res.status(403).json({ message: 'You have no access to this resource!' });
    }

    if (user.enabled) {
      return res.status(200).json({ message: `User with id "${id}" is already enabled!` });
    }

    user.enabled = true;
    const updatedUser = await User.findByIdAndUpdate(id, user, { new: true }).exec();

    if (updatedUser?.enabled) {
      return res.status(200).json({ message: `User with id "${id}" enabled!` });
    }
  } catch (err) {
    console.log(`enableUser Error: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Superadmins can disable any admin or basic level user
// Admins ca disable any basic level user
const disableUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.body.currentUser as UserDocument;

  if (isBasicLevelUser(currentUser)) {
    return res.status(403).json({ message: 'Forbidden!' });
  }

  try {
    const user = (await User.findById(id).populate('role').exec()) as UserDocument;

    if (!user) {
      return res.status(404).json({ message: `User with id "${id}" not found!` });
    }

    if (isSuperAdmin(user)) {
      return res.status(403).json({ message: 'You have no access to this resource!' });
    }

    if (isAdmin(currentUser) && !isBasicLevelUser(user)) {
      return res.status(403).json({ message: 'You have no access to this resource!' });
    }

    if (!user.enabled) {
      return res.status(200).json({ message: `User with id "${id}" is already disabled!` });
    }

    user.enabled = false;
    await User.findByIdAndUpdate(id, user, { new: true });

    return res.status(200).json({ message: `User with id "${id}" disabled!` });
  } catch (err) {
    console.log(`disableUser Error: ${err}`);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export { createUser, deleteUser, getAllUsers, getUser, updateUser, getMyProfile, updateMyself, enableUser, disableUser };
