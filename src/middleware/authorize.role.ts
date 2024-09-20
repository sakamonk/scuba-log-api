import { Request, Response, NextFunction } from 'express';
import { roleNameForAdmins, roleNameForSuperAdmins } from '../../src/utils/role.helper';
import { UserDocument } from '../models/user.model';
import { RoleDocument } from '../models/role.model';

function authorizeRole(roleName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req?.body?.currentUser as UserDocument;
    const role = user?.role as unknown as RoleDocument;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized!' });
    }

    if (role.name !== roleName) {
      return res.status(403).json({ message: 'Forbidden!' });
    }

    next(); // user belongs to the correct role group
  };
}

const authorizeAdmin = authorizeRole(roleNameForAdmins);
const authorizeSuperAdmin = authorizeRole(roleNameForSuperAdmins);

export { authorizeAdmin, authorizeSuperAdmin };
