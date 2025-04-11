/**
 * Password Utilities
 * Functions for hashing and comparing passwords
 */

const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Number of salt rounds for bcrypt
const SALT_ROUNDS = 12;

/**
 * Generate a random salt
 * @returns {string} Random salt
 */
const generateSalt = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Object} Object containing hash and salt
 */
exports.hashPassword = async (password) => {
  const salt = generateSalt();
  const hash = await bcrypt.hash(password + salt, SALT_ROUNDS);
  return { hash, salt };
};

/**
 * Compare a password with a hash
 * @param {string} password - Plain text password to check
 * @param {string} hash - Stored password hash
 * @param {string} salt - Salt used when hashing
 * @returns {boolean} True if password matches hash
 */
exports.comparePassword = async (password, hash, salt) => {
  return await bcrypt.compare(password + salt, hash);
};