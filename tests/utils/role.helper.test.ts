import { UserDocument } from '../../src/models/user.model';
import { RoleDocument } from '../../src/models/role.model';
import { roleNameForAdmins, roleNameForBasicUsers, roleNameForSuperAdmins } from '../../src/utils/role.helper';
import { isAdmin, isBasicUser, isSuperAdmin } from '../../src/utils/role.helper';
import { isBasicLevelUser, isAdminLevelUser } from '../../src/utils/role.helper';

describe('Role Helper', () => {
  const userRoleMock = { id: 'bu', name: roleNameForBasicUsers } as Partial<RoleDocument>;
  const adminRoleMock = { id: 'ad', name: roleNameForAdmins } as Partial<RoleDocument>;
  const superAdminRoleMock = { id: 'sa', name: roleNameForSuperAdmins } as Partial<RoleDocument>;
  const userMock = { id: '1', fullName: 'Basic User Tester', role: userRoleMock } as UserDocument;
  const adminMock = { id: '2', fullName: 'Admin Tester', role: adminRoleMock } as UserDocument;
  const superAdminMock = { id: '3', fullName: 'Super Admin Tester', role: superAdminRoleMock } as UserDocument;

  describe('isBasicUser', () => {
    it('should return true for defined basic user role', async () => {
      expect(isBasicUser(userMock)).toBe(true);
    });

    it('should return false for other user roles', async () => {
      expect(isBasicUser(adminMock)).toBe(false);
      expect(isBasicUser(superAdminMock)).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for defined admin role', async () => {
      expect(isAdmin(adminMock)).toBe(true);
    });

    it('should return false for other user roles', async () => {
      expect(isAdmin(userMock)).toBe(false);
      expect(isAdmin(superAdminMock)).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('should return true for defined super admin role', async () => {
      expect(isSuperAdmin(superAdminMock)).toBe(true);
    });

    it('should return false for other user roles', async () => {
      expect(isSuperAdmin(userMock)).toBe(false);
      expect(isSuperAdmin(adminMock)).toBe(false);
    });
  });

  describe('isBasicLevelUser', () => {
    it('should return true for basic users', async () => {
      expect(isBasicLevelUser(userMock)).toBe(true);
    });

    it('should return false for admin and super admin users', async () => {
      expect(isBasicLevelUser(adminMock)).toBe(false);
      expect(isBasicLevelUser(superAdminMock)).toBe(false);
    });
  });

  describe('isAdminLevelUser', () => {
    it('should return true for admin and super admin users', async () => {
      expect(isAdminLevelUser(adminMock)).toBe(true);
      expect(isAdminLevelUser(superAdminMock)).toBe(true);
    });

    it('should return false for basic users', async () => {
      expect(isAdminLevelUser(userMock)).toBe(false);
    });
  });
});
