import { UserDocument } from '../models/user.model';
import { RoleDocument } from '../models/role.model';

export const roleNameForSuperAdmins = 'super_admin';
export const roleNameForAdmins = 'admin';
export const roleNameForBasicUsers = 'basic_user';

export const isSuperAdmin = (user: UserDocument) => {
  const role = user.role as unknown as RoleDocument;

  return role.name === roleNameForSuperAdmins;
};

export const isAdmin = (user: UserDocument) => {
  const role = user.role as unknown as RoleDocument;

  return role.name === roleNameForAdmins;
};

export const isBasicUser = (user: UserDocument) => {
  const role = user.role as unknown as RoleDocument;

  return role.name === roleNameForBasicUsers;
};

export const isBasicLevelUser = (user: UserDocument) => {
  return !isSuperAdmin(user) && !isAdmin(user);
};

export const isAdminLevelUser = (user: UserDocument) => {
  return !isBasicLevelUser(user);
};
