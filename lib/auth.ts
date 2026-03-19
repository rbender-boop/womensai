import crypto from 'crypto';

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const derived = hashPassword(password, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}
