import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { comparePasswords } from '../utils/password.helper';

const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Find user by email and select only necessary fields (password is excluded by default)
    const user = await User.findOne({ email }, { email: 1, password: 1, enabled: 1 });

    if (!user) {
      return res.status(404).json({ error: 'User not found!' });
    }

    if (!user.enabled) {
      return res.status(403).json({ error: 'The account have been disabled!' });
    }

    const isCorrectPassword = comparePasswords(password, user.password);

    if (!isCorrectPassword) {
      return res.status(401).json({ error: 'Invalid credentials!' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRATION || '1h' });

    return res.status(200).json({ token });
  } catch (err) {
    console.log(`Error logging in: ${err}`);
    return res.status(500).json({ error: 'Login failed!' });
  }
};

export { loginUser };
