/**
 * Router
 * Handles client-side routing for the single-page application
 */

const router = (() => {
    // Private variables
    let routes = {};
    let currentHash = '';
    let defaultRoute = '';
    let notFoundHandler = null;
    
    /**
     * Initialize the router
     * @param {Object} options - Router options
     * @param {string} options.default - Default route
     * @param {Function} options.notFound - Handler for routes that don't exist
     */
    const init = (options = {}) => {
      // Set default route if provided
      if (options.default) {
        defaultRoute = options.default;
      }
      
      // Set not found handler if provided
      if (options.notFound && typeof options.notFound === 'function') {
        notFoundHandler = options.notFound;
      }
      
      // Listen for hash changes
      window.addEventListener('hashchange', handleRouteChange);
      
      // Initial route handling
      handleRouteChange();
    };
    
    /**
     * Handle route change
     */
    const handleRouteChange = () => {
      // Get current hash without the # symbol
      currentHash = window.location.hash.slice(1) || defaultRoute;
      
      // Parse route path and parameters
      const { path, params } = parseRoute(currentHash);
      
      // Find matching route handler
      let matchedRoute = null;
      
      // Check for exact match first
      if (routes[path]) {
        matchedRoute = { handler: routes[path], params };
      } else {
        // Check for pattern matches (routes with parameters)
        matchedRoute = findPatternMatch(path, params);
      }
      
      // Execute route handler if found, otherwise call notFoundHandler
      if (matchedRoute) {
        matchedRoute.handler(matchedRoute.params);
      } else if (notFoundHandler) {
        notFoundHandler(path);
      } else {
        console.warn(`No handler found for route: ${path}`);
      }
    };
    
    /**
     * Parse route into path and parameters
     * @param {string} routeString - Complete route string
     * @returns {Object} - Route path and parameters
     */
    const parseRoute = (routeString) => {
      // Split route by query parameters
      const [pathPart, queryPart] = routeString.split('?');
      
      // Split path by slashes
      const pathSegments = pathPart.split('/').filter(segment => segment !== '');
      
      // Base path (first segment)
      const basePath = pathSegments[0] || '';
      
      // Parameters from path segments (everything after the first segment)
      const pathParams = pathSegments.slice(1);
      
      // Parameters from query string
      const queryParams = {};
      if (queryPart) {
        queryPart.split('&').forEach(param => {
          const [key, value] = param.split('=');
          if (key) {
            queryParams[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
          }
        });
      }
      
      return {
        path: basePath,
        params: {
          path: pathParams,
          query: queryParams,
          full: routeString
        }
      };
    };
    
    /**
     * Find a matching route pattern for dynamic routes
     * @param {string} path - Route path
     * @param {Object} params - Route parameters
     * @returns {Object|null} - Matched route or null if not found
     */
    const findPatternMatch = (path, params) => {
      // For now we just support simple routes, but this method can be expanded
      // to support more complex pattern matching (e.g., /users/:id)
      return null;
    };
    
    /**
     * Register a route handler
     * @param {string} path - Route path
     * @param {Function} handler - Route handler function
     */
    const register = (path, handler) => {
      if (typeof handler !== 'function') {
        throw new Error(`Route handler for "${path}" must be a function`);
      }
      
      routes[path] = handler;
    };
    
    /**
     * Navigate to a route
     * @param {string} path - Route path
     * @param {Object} params - Route parameters
     * @param {Object} options - Navigation options
     */
    const navigate = (path, params = {}, options = {}) => {
      // Build query string from params.query
      let queryString = '';
      if (params.query && typeof params.query === 'object') {
        const queryParams = [];
        for (const key in params.query) {
          if (params.query.hasOwnProperty(key) && params.query[key] !== undefined) {
            queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(params.query[key])}`);
          }
        }
        if (queryParams.length > 0) {
          queryString = `?${queryParams.join('&')}`;
        }
      }
      
      // Build path segments from params.path
      let pathSegments = '';
      if (params.path && Array.isArray(params.path)) {
        pathSegments = `/${params.path.join('/')}`;
      }
      
      // Complete route
      const route = `${path}${pathSegments}${queryString}`;
      
      // Update hash to trigger route change
      window.location.hash = `#${route}`;
      
      // If replace option is set, replace the current history entry
      if (options.replace) {
        history.replaceState(null, null, `#${route}`);
      }
    };
    
    /**
     * Get current route information
     * @returns {Object} - Current route information
     */
    const getCurrentRoute = () => {
      return parseRoute(currentHash);
    };
    
    // Public API
    return {
      init,
      register,
      navigate,
      getCurrentRoute
    };
  })();
  
  // Make router available globally
  window.router = router;