import crypto from 'crypto';

const encryptPlainPassword = (plainString: string): string => {
  // Hashing salt and password with 150 iterations, 128 length and sha512 digest
  const salt: string = process.env.SECRET_SALT!;
  const hash: string = crypto.pbkdf2Sync(plainString, salt, 150, 128, 'sha512').toString('hex');

  return hash;
};

const comparePasswords = (givenPassword: string, userPasswordHash: string): boolean => {
  const hashedPassword: string = encryptPlainPassword(givenPassword);

  return hashedPassword == userPasswordHash;
};

export { encryptPlainPassword, comparePasswords };
