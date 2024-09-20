import { Router } from 'express';
import { check } from 'express-validator';
import { authenticateToken } from '../middleware/authenticate.token';
import { createLog, deleteLog, getAllLogs, getLog, updateLog } from '../controllers/logbook.controller';

import '../docs/logbook.swagger'; // import the Swagger definition

const logbookRoute = (): Router => {
  const router = Router();

  router.post(
    '/logbooks',
    [
      // Validate tank material value
      check('tankMaterial').optional().isIn(['Aluminium', 'Steel']).withMessage('Please enter a valid tank material from the list: Aluminium, Steel'),
    ],
    authenticateToken,
    createLog,
  );

  router.get('/logbooks', authenticateToken, getAllLogs);
  router.get('/logbooks/:id', authenticateToken, getLog);
  router.patch('/logbooks/:id', authenticateToken, updateLog);
  router.delete('/logbooks/:id', authenticateToken, deleteLog);

  return router;
};

export { logbookRoute };
