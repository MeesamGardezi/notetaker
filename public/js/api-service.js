/**
 * API Service
 * Handles API requests to the server
 */

// Base URL for API requests
const API_BASE_URL = '/api';

// Default request options
const defaultOptions = {
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include' // Include cookies in requests
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  
  // Parse response based on content type
  let data;
  try {
    data = isJson ? await response.json() : await response.text();
  } catch (error) {
    console.warn('Failed to parse response:', error);
    data = isJson ? {} : '';
  }
  
  // Check if response is OK
  if (!response.ok) {
    // Try to extract error message from response data
    const errorMessage = isJson && data && data.message ? data.message : `API request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.response = response;
    error.data = data;
    throw error;
  }
  
  return data;
};

// API Service object
const apiService = {
  /**
   * Send a GET request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  get: async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        method: 'GET'
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  },
  
  /**
   * Send a POST request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  post: async (endpoint, data = {}, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  },
  
  /**
   * Send a PUT request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  put: async (endpoint, data = {}, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  },
  
  /**
   * Send a DELETE request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  delete: async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        method: 'DELETE'
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  },
  
  /**
   * Upload a file to the API
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data with file
   * @param {Function} progressCallback - Callback for upload progress
   * @param {Object} options - Additional fetch options
   * @returns {Promise<any>} - Response data
   */
  uploadFile: async (endpoint, formData, progressCallback = null, options = {}) => {
    try {
      // Remove Content-Type header so browser can set it with boundary
      const headers = { ...defaultOptions.headers };
      delete headers['Content-Type'];
      
      const xhr = new XMLHttpRequest();
      
      // Create promise to handle XHR
      const promise = new Promise((resolve, reject) => {
        xhr.open('POST', `${API_BASE_URL}${endpoint}`);
        
        // Set headers
        Object.keys(headers).forEach(key => {
          xhr.setRequestHeader(key, headers[key]);
        });
        
        // Handle response
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (error) {
              resolve(xhr.responseText);
            }
          } else {
            const errorMsg = `Upload failed with status ${xhr.status}`;
            console.error(errorMsg);
            reject(new Error(errorMsg));
          }
        };
        
        // Handle errors
        xhr.onerror = () => reject(new Error('Network error during upload'));
        
        // Handle progress if callback provided
        if (progressCallback && typeof progressCallback === 'function') {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              progressCallback(percentComplete);
            }
          };
        }
        
        // Send the form data
        xhr.send(formData);
      });
      
      return promise;
    } catch (error) {
      console.error(`File upload to ${endpoint} failed:`, error);
      throw error;
    }
  },
  
  /**
   * Check if error is an authentication error (401)
   * @param {Error} error - Error object
   * @returns {boolean} - Whether error is an authentication error
   */
  isAuthError: (error) => {
    return error && (error.status === 401 || (error.response && error.response.status === 401));
  }
};

// Make the API service available globally
window.apiService = apiService;