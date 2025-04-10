/**
 * Validators Utility
 * Validation helpers for data validation
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result with errors if any
   */
  const validatePassword = (password) => {
    const errors = [];
    
    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!(/[A-Z]/).test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!(/[a-z]/).test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!(/[0-9]/).test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Validate module name
   * @param {string} name - Module name to validate
   * @returns {Object} - Validation result with errors if any
   */
  const validateModuleName = (name) => {
    const errors = [];
    
    if (!name || name.trim() === '') {
      errors.push('Module name is required');
    }
    
    if (name && name.length > 100) {
      errors.push('Module name must be at most 100 characters long');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Validate note content
   * @param {string} content - Note content to validate
   * @returns {Object} - Validation result with errors if any
   */
  const validateNoteContent = (content) => {
    const errors = [];
    
    // No specific validation for content length, as notes can be empty
    // or very long, but we can add more validations if needed
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Validate hex color code
   * @param {string} color - Color code to validate
   * @returns {boolean} - Whether color is valid
   */
  const validateHexColor = (color) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };
  
  /**
   * Validate UUID v4
   * @param {string} uuid - UUID to validate
   * @returns {boolean} - Whether UUID is valid
   */
  const validateUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };
  
  /**
   * Validate MongoDB ObjectID
   * @param {string} id - ObjectID to validate
   * @returns {boolean} - Whether ObjectID is valid
   */
  const validateObjectID = (id) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  };
  
  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether URL is valid
   */
  const validateURL = (url) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Validate phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - Whether phone number is valid
   */
  const validatePhoneNumber = (phone) => {
    // Basic phone validation (international format with + and digits)
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone);
  };
  
  /**
   * Validate date format
   * @param {string} date - Date string to validate
   * @param {string} format - Expected format (ISO8601, YYYY-MM-DD)
   * @returns {boolean} - Whether date is valid
   */
  const validateDate = (date, format = 'ISO8601') => {
    if (format === 'ISO8601') {
      // ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z?$/;
      if (!isoDateRegex.test(date)) {
        return false;
      }
    } else if (format === 'YYYY-MM-DD') {
      // Simple date format (YYYY-MM-DD)
      const simpleDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!simpleDateRegex.test(date)) {
        return false;
      }
    }
    
    // Check if it's a valid date
    const d = new Date(date);
    return !isNaN(d.getTime());
  };
  
  /**
   * Validate file size
   * @param {number} size - File size in bytes
   * @param {number} maxSize - Maximum allowed size in bytes
   * @returns {boolean} - Whether file size is valid
   */
  const validateFileSize = (size, maxSize) => {
    return size > 0 && size <= maxSize;
  };
  
  /**
   * Validate file type
   * @param {string} mimeType - File MIME type
   * @param {string[]} allowedTypes - Array of allowed MIME types
   * @returns {boolean} - Whether file type is valid
   */
  const validateFileType = (mimeType, allowedTypes) => {
    return allowedTypes.includes(mimeType);
  };
  
  /**
   * Validate username
   * @param {string} username - Username to validate
   * @returns {Object} - Validation result with errors if any
   */
  const validateUsername = (username) => {
    const errors = [];
    
    if (!username || username.trim() === '') {
      errors.push('Username is required');
    }
    
    if (username && username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    
    if (username && username.length > 30) {
      errors.push('Username must be at most 30 characters long');
    }
    
    if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, underscores and hyphens');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Sanitize input to prevent XSS
   * @param {string} input - Input to sanitize
   * @returns {string} - Sanitized input
   */
  const sanitizeInput = (input) => {
    if (!input) {
      return '';
    }
    
    // Replace potentially dangerous characters
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  module.exports = {
    validateEmail,
    validatePassword,
    validateModuleName,
    validateNoteContent,
    validateHexColor,
    validateUUID,
    validateObjectID,
    validateURL,
    validatePhoneNumber,
    validateDate,
    validateFileSize,
    validateFileType,
    validateUsername,
    sanitizeInput
  };