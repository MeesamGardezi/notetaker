/**
 * File Utility
 * Utility functions for file handling
 */

const path = require('path');
const crypto = require('crypto');
const config = require('../config/app.config');
const { promisify } = require('util');
const fs = require('fs');

/**
 * Generate a unique filename
 * @param {string} originalFilename - Original filename
 * @returns {string} - Unique filename
 */
const generateUniqueFilename = (originalFilename) => {
  const ext = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, ext);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  
  return `${baseName}-${timestamp}-${randomString}${ext}`;
};

/**
 * Check if file type is allowed
 * @param {string} mimeType - File MIME type
 * @returns {boolean} - Whether file type is allowed
 */
const isAllowedFileType = (mimeType) => {
  return config.upload.allowedMimeTypes.includes(mimeType);
};

/**
 * Get file extension from MIME type
 * @param {string} mimeType - File MIME type
 * @returns {string} - File extension (with dot)
 */
const getExtensionFromMimeType = (mimeType) => {
  const mimeToExt = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt',
    'text/csv': '.csv',
    'application/json': '.json'
  };
  
  return mimeToExt[mimeType] || '';
};

/**
 * Format file size to human-readable format
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted size
 */
const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Get MIME type from file extension
 * @param {string} filename - Filename
 * @returns {string|null} - MIME type or null if unknown
 */
const getMimeTypeFromFilename = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  
  const extToMime = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json'
  };
  
  return extToMime[ext] || null;
};

/**
 * Check if a directory exists, and create it if it doesn't
 * @param {string} dirPath - Directory path
 */
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.promises.access(dirPath);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.promises.mkdir(dirPath, { recursive: true });
  }
};

/**
 * Delete a file
 * @param {string} filePath - File path
 * @returns {Promise<boolean>} - Whether file was deleted
 */
const deleteFile = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Read a file
 * @param {string} filePath - File path
 * @param {string} encoding - File encoding (optional)
 * @returns {Promise<Buffer|string>} - File contents
 */
const readFile = async (filePath, encoding = null) => {
  try {
    if (encoding) {
      return await fs.promises.readFile(filePath, { encoding });
    } else {
      return await fs.promises.readFile(filePath);
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Save a file
 * @param {string} filePath - File path
 * @param {Buffer|string} content - File content
 * @returns {Promise<void>}
 */
const saveFile = async (filePath, content) => {
  try {
    // Ensure directory exists
    const dirPath = path.dirname(filePath);
    await ensureDirectoryExists(dirPath);
    
    // Write file
    await fs.promises.writeFile(filePath, content);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateUniqueFilename,
  isAllowedFileType,
  getExtensionFromMimeType,
  formatFileSize,
  getMimeTypeFromFilename,
  ensureDirectoryExists,
  deleteFile,
  readFile,
  saveFile
};