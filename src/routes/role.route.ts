import { Router } from 'express';
import { authenticateToken } from '../middleware/authenticate.token';
import { authorizeSuperAdmin } from '../middleware/authorize.role';
import { createRole, deleteRole, getAllRoles, getRole, updateRole } from '../controllers/role.controller';

import '../docs/role.swagger'; // import the Swagger definition

const roleRoute = (): Router => {
  const router = Router();

  // Only superadmins can access roles
  router.post('/roles', authenticateToken, authorizeSuperAdmin, createRole);
  router.get('/roles', authenticateToken, authorizeSuperAdmin, getAllRoles);
  router.get('/roles/:id', authenticateToken, authorizeSuperAdmin, getRole);
  router.patch('/roles/:id', authenticateToken, authorizeSuperAdmin, updateRole);
  router.delete('/roles/:id', authenticateToken, authorizeSuperAdmin, deleteRole);

  return router;
};

export { roleRoute };
