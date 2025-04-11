/**
 * Validators Utility
 * Helper functions for validating data
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
exports.isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };
  
  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result with strength and message
   */
  exports.validatePasswordStrength = (password) => {
    const result = {
      isValid: false,
      strength: 'weak',
      message: ''
    };
  
    // Check length
    if (password.length < 8) {
      result.message = 'Password must be at least 8 characters long';
      return result;
    }
  
    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
      result.message = 'Password must contain at least one lowercase letter';
      return result;
    }
  
    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
      result.message = 'Password must contain at least one uppercase letter';
      return result;
    }
  
    // Check for numbers
    if (!/\d/.test(password)) {
      result.message = 'Password must contain at least one number';
      return result;
    }
  
    // Determine strength
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isLong = password.length >= 12;
  
    if (hasSpecialChar && isLong) {
      result.strength = 'strong';
    } else if (hasSpecialChar || isLong) {
      result.strength = 'medium';
    }
  
    result.isValid = true;
    return result;
  };
  
  /**
   * Check if a string is a valid hexadecimal color
   * @param {string} color - Color string to validate
   * @returns {boolean} True if color is a valid hex color
   */
  exports.isValidHexColor = (color) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };
  
  /**
   * Sanitize a string for safe storage/display
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  exports.sanitizeString = (str) => {
    if (!str) return '';
    return str
      .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
      .trim();
  };
  
  /**
   * Generates a slug from a string
   * @param {string} str - String to slugify
   * @returns {string} Slugified string
   */
  exports.slugify = (str) => {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars
      .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and hyphens with a single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };