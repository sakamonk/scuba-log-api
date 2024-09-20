import { UserDocument } from '../../src/models/user.model';
import { RoleDocument } from '../../src/models/role.model';
import { DiveLogDocument } from '../../src/models/dive.log.model';
import { roleNameForAdmins, roleNameForBasicUsers, roleNameForSuperAdmins } from '../../src/utils/role.helper';
import { isUserAllowedToAccessLog } from '../../src/utils/dive.log.access.helper';

describe('DiveLog Access Helper', () => {
  const userRoleMock = { _id: 'bu', name: roleNameForBasicUsers } as Partial<RoleDocument>;
  const adminRoleMock = { _id: 'ad', name: roleNameForAdmins } as Partial<RoleDocument>;
  const superAdminRoleMock = { _id: 'sa', name: roleNameForSuperAdmins } as Partial<RoleDocument>;
  const user1Mock = { _id: 'u1', fullName: 'Basic User Tester', role: userRoleMock } as UserDocument;
  const user2Mock = { _id: 'u2', fullName: 'Basic User Tester', role: userRoleMock } as UserDocument;
  const admin1Mock = { _id: 'a1', fullName: 'Admin Tester', role: adminRoleMock } as UserDocument;
  const admin2Mock = { _id: 'a2', fullName: 'Admin Tester', role: adminRoleMock } as UserDocument;
  const superAdmin1Mock = { _id: 'sa1', fullName: 'Super Admin Tester', role: superAdminRoleMock } as UserDocument;
  const superAdmin2Mock = { _id: 'sa2', fullName: 'Super Admin Tester', role: superAdminRoleMock } as UserDocument;
  const userDiveLog1 = { _id: 'dl1', user: user1Mock } as unknown as DiveLogDocument;
  const userDiveLog2 = { _id: 'dl2', user: user2Mock } as unknown as DiveLogDocument;
  const adminDiveLog1 = { _id: 'dl3', user: admin1Mock } as unknown as DiveLogDocument;
  const adminDiveLog2 = { _id: 'dl4', user: admin2Mock } as unknown as DiveLogDocument;
  const superAdminDiveLog1 = { _id: 'dl5', user: superAdmin1Mock } as unknown as DiveLogDocument;
  const superAdminDiveLog2 = { _id: 'dl6', user: superAdmin2Mock } as unknown as DiveLogDocument;
  const nullUserDiveLog = { _id: 'dl87', user: null } as unknown as DiveLogDocument;

  describe('isUserAllowedToAccessLog', () => {
    describe('Basic User', () => {
      it('should return true for accessing their own log', async () => {
        expect(isUserAllowedToAccessLog(user1Mock, userDiveLog1)).toBe(true);
        expect(isUserAllowedToAccessLog(user2Mock, userDiveLog2)).toBe(true);
      });

      it('should return false for accessing other basic users log', async () => {
        expect(isUserAllowedToAccessLog(user1Mock, userDiveLog2)).toBe(false);
        expect(isUserAllowedToAccessLog(user2Mock, userDiveLog1)).toBe(false);
      });

      it('should return false for accessing a log with no user', async () => {
        expect(isUserAllowedToAccessLog(user1Mock, nullUserDiveLog)).toBe(false);
        expect(isUserAllowedToAccessLog(user2Mock, nullUserDiveLog)).toBe(false);
      });

      it('should return false for accessing other level users log', async () => {
        expect(isUserAllowedToAccessLog(user1Mock, adminDiveLog1)).toBe(false);
        expect(isUserAllowedToAccessLog(user2Mock, adminDiveLog2)).toBe(false);
        expect(isUserAllowedToAccessLog(user1Mock, superAdminDiveLog1)).toBe(false);
        expect(isUserAllowedToAccessLog(user2Mock, superAdminDiveLog2)).toBe(false);
      });
    });

    describe('Admin Level User', () => {
      it('should return true for accessing basic level user log', async () => {
        expect(isUserAllowedToAccessLog(admin1Mock, userDiveLog1)).toBe(true);
        expect(isUserAllowedToAccessLog(admin2Mock, userDiveLog2)).toBe(true);
      });

      it('should return true for accessing their own log', async () => {
        expect(isUserAllowedToAccessLog(admin1Mock, adminDiveLog1)).toBe(true);
        expect(isUserAllowedToAccessLog(admin2Mock, adminDiveLog2)).toBe(true);
      });

      it('should return true for accessing a log with no user', async () => {
        expect(isUserAllowedToAccessLog(admin1Mock, nullUserDiveLog)).toBe(true);
        expect(isUserAllowedToAccessLog(admin2Mock, nullUserDiveLog)).toBe(true);
      });

      it('should return false for accessing other admin level log', async () => {
        expect(isUserAllowedToAccessLog(admin1Mock, adminDiveLog2)).toBe(false);
        expect(isUserAllowedToAccessLog(admin2Mock, adminDiveLog1)).toBe(false);
      });

      it('should return false for accessing super admin level log', async () => {
        expect(isUserAllowedToAccessLog(admin1Mock, superAdminDiveLog1)).toBe(false);
        expect(isUserAllowedToAccessLog(admin2Mock, superAdminDiveLog2)).toBe(false);
      });
    });

    describe('Superadmin Level User', () => {
      it('should return true for accessing basic level user log', async () => {
        expect(isUserAllowedToAccessLog(superAdmin1Mock, userDiveLog1)).toBe(true);
        expect(isUserAllowedToAccessLog(superAdmin2Mock, userDiveLog2)).toBe(true);
      });

      it('should return true for accessing their own log', async () => {
        expect(isUserAllowedToAccessLog(superAdmin1Mock, superAdminDiveLog1)).toBe(true);
        expect(isUserAllowedToAccessLog(superAdmin2Mock, superAdminDiveLog2)).toBe(true);
      });

      it('should return true for accessing a log with no user', async () => {
        expect(isUserAllowedToAccessLog(superAdmin1Mock, nullUserDiveLog)).toBe(true);
        expect(isUserAllowedToAccessLog(superAdmin2Mock, nullUserDiveLog)).toBe(true);
      });

      it('should return true for accessing admin level log', async () => {
        expect(isUserAllowedToAccessLog(superAdmin1Mock, adminDiveLog1)).toBe(true);
        expect(isUserAllowedToAccessLog(superAdmin2Mock, adminDiveLog1)).toBe(true);
        expect(isUserAllowedToAccessLog(superAdmin1Mock, adminDiveLog2)).toBe(true);
        expect(isUserAllowedToAccessLog(superAdmin2Mock, adminDiveLog2)).toBe(true);
      });

      it('should return true for accessing other super admin level log', async () => {
        expect(isUserAllowedToAccessLog(superAdmin1Mock, superAdminDiveLog2)).toBe(true);
        expect(isUserAllowedToAccessLog(superAdmin2Mock, superAdminDiveLog1)).toBe(true);
      });
    });
  });
});
