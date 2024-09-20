import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';

const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers || !req?.headers['authorization']) {
    return res.status(401).json({ message: 'Token is missing!' });
  }

  const authHeader = req?.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token is missing!' });
  }

  try {
    // verify the JWT token and extract the user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const user = await User.findById(decoded.userId).populate('role');

    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Attach the user and their role to the request object
    req.body.currentUser = user;

    next();
  } catch (err) {
    console.log(`JWT verification error: ${err}`);
    return res.status(403).json({ message: 'Token is invalid or expired!' });
  }
};

export { authenticateToken };
