import { Router } from 'express';
import { check } from 'express-validator';
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUser,
  updateUser,
  getMyProfile,
  updateMyself,
  enableUser,
  disableUser,
} from '../controllers/user.controller';
import { loginUser } from '../controllers/login.controller';
import { authenticateToken } from '../middleware/authenticate.token';
import { loginRateLimiterHigh } from '../utils/rate.limiter.helper';

import '../docs/user.swagger'; // import the Swagger definition

const userRoute = (): Router => {
  const router = Router();

  // Routes for any role without authentication
  router.post('/users/login', loginRateLimiterHigh, loginUser); // Uses very basic brute-force prevention

  // Authenticated routes
  router.get('/me', authenticateToken, getMyProfile);
  router.patch('/me/update', authenticateToken, updateMyself);

  router.post(
    '/users',
    [
      // Validate email and password
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Please enter a password with 12 or more characters').isLength({ min: 12 }),
    ],
    authenticateToken,
    createUser,
  );

  router.get('/users', authenticateToken, getAllUsers);
  router.get('/users/:id', authenticateToken, getUser);
  router.patch('/users/:id', authenticateToken, updateUser);
  router.delete('/users/:id', authenticateToken, deleteUser);
  router.patch('/users/activate/:id', authenticateToken, enableUser);
  router.patch('/users/deactivate/:id', authenticateToken, disableUser);

  return router;
};

export { userRoute };
