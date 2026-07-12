import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'transitops_super_secret_jwt_key_2026_hackathon_production';
  return new TextEncoder().encode(secret);
};

/**
 * Creates a signed JWT token valid for 7 days
 * @param {object} payload 
 * @returns {Promise<string>}
 */
export async function createToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

/**
 * Verifies a JWT token and returns payload or null if invalid/expired
 * @param {string} token 
 * @returns {Promise<object|null>}
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Hash plain text password using bcryptjs
 * @param {string} password 
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

/**
 * Compare plain text password against stored hash
 * @param {string} password 
 * @param {string} hash 
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (err) {
    return false;
  }
}

/**
 * Role-Based Access Control check
 * @param {string} userRole 
 * @param {string[]} allowedRoles 
 * @returns {boolean}
 */
export function hasRole(userRole, allowedRoles = []) {
  if (!userRole) return false;
  if (userRole === 'Admin') return true; // Admin has root permissions across all modules
  return allowedRoles.includes(userRole);
}

/**
 * Map Role ID to Role Name
 */
export const ROLE_ID_MAP = {
  1: 'Admin',
  2: 'Fleet Manager',
  3: 'Driver',
  4: 'Safety Officer',
  5: 'Finance'
};
