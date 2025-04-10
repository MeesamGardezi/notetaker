/**
 * Placeholder Utilities
 * Provides functions for creating placeholder content when actual content is not available
 */

const placeholderUtils = (() => {
    /**
     * Generate a placeholder avatar element
     * @param {string} name - User name for initials
     * @param {string} size - Size of avatar: 'sm', 'md', or 'lg'
     * @returns {HTMLElement} - Avatar element
     */
    const createAvatarPlaceholder = (name, size = 'md') => {
      // Create container
      const avatar = document.createElement('div');
      avatar.className = `avatar-placeholder avatar-placeholder-${size}`;
      
      // Get initials from name
      let initials = '?';
      if (name && typeof name === 'string') {
        const parts = name.trim().split(' ');
        if (parts.length === 1) {
          initials = parts[0].charAt(0).toUpperCase();
        } else if (parts.length > 1) {
          initials = (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
      }
      
      // Set content
      avatar.textContent = initials;
      
      return avatar;
    };
    
    /**
     * Replace missing images with placeholders
     * This can be called on page load to handle missing images
     */
    const handleMissingImages = () => {
      // Handle avatar images
      document.querySelectorAll('.user-avatar').forEach(img => {
        img.onerror = function() {
          // Get container
          const container = this.parentElement;
          
          // Remove the broken image
          this.remove();
          
          // Get user name if available
          let name = 'User';
          const nameElement = container.querySelector('.user-name, #header-user-name, #welcome-user-name');
          if (nameElement) {
            name = nameElement.textContent || 'User';
          }
          
          // Create and append placeholder
          const placeholder = createAvatarPlaceholder(name, 'sm');
          container.appendChild(placeholder);
        };
      });
      
      // Handle hero image
      const heroImage = document.querySelector('.hero-image');
      if (heroImage) {
        heroImage.onerror = function() {
          // Get container
          const container = this.parentElement;
          
          // Remove the broken image
          this.remove();
          
          // Create hero placeholder
          const placeholder = document.createElement('div');
          placeholder.className = 'hero-image-placeholder';
          placeholder.innerHTML = '<i class="fas fa-book-open"></i>';
          
          // Append placeholder
          container.appendChild(placeholder);
        };
      }
      
      // Handle testimonial images
      document.querySelectorAll('.testimonial-image').forEach(img => {
        img.onerror = function() {
          // Get container
          const container = this.parentElement;
          
          // Remove the broken image
          this.remove();
          
          // Create and append placeholder
          const placeholder = document.createElement('div');
          placeholder.className = 'testimonial-image-placeholder';
          placeholder.innerHTML = '<i class="fas fa-user"></i>';
          container.appendChild(placeholder);
        };
      });
    };
    
    /**
     * Creates a data URL for a placeholder avatar
     * @param {string} initials - Initials to display
     * @param {string} bgColor - Background color (hex)
     * @param {string} textColor - Text color (hex)
     * @param {number} size - Size in pixels
     * @returns {string} - Data URL
     */
    const createAvatarDataUrl = (initials = '?', bgColor = '#3498db', textColor = '#ffffff', size = 200) => {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      
      // Get context
      const context = canvas.getContext('2d');
      
      // Draw background
      context.fillStyle = bgColor;
      context.beginPath();
      context.arc(size/2, size/2, size/2, 0, Math.PI * 2);
      context.fill();
      
      // Draw text
      context.fillStyle = textColor;
      context.font = `bold ${size/2}px Arial, sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(initials, size/2, size/2);
      
      // Convert to data URL
      return canvas.toDataURL('image/png');
    };
    
    /**
     * Dynamically load placeholder images if missing
     * @param {string} selector - CSS selector for images to check
     */
    const loadMissingImages = (selector = 'img') => {
      // Handle all images matching selector
      document.querySelectorAll(selector).forEach(img => {
        // Skip if src is a data URL or blob
        if (img.src.startsWith('data:') || img.src.startsWith('blob:')) {
          return;
        }
        
        // Skip if already loaded
        if (img.complete && img.naturalHeight !== 0) {
          return;
        }
        
        // Handle error
        img.onerror = () => {
          // Determine type of placeholder based on class or element
          if (img.classList.contains('user-avatar')) {
            // User avatar
            const parent = img.parentElement;
            let name = 'User';
            
            // Try to get name from nearby elements
            const nameElement = parent.querySelector('.user-name') || 
                                document.getElementById('header-user-name') || 
                                document.getElementById('welcome-user-name');
            
            if (nameElement) {
              name = nameElement.textContent || 'User';
            }
            
            // Get initials
            const parts = name.trim().split(' ');
            let initials = '?';
            
            if (parts.length === 1) {
              initials = parts[0].charAt(0).toUpperCase();
            } else if (parts.length > 1) {
              initials = (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
            }
            
            // Create data URL
            img.src = createAvatarDataUrl(initials, '#3498db', '#ffffff', 200);
          } else if (img.classList.contains('hero-image')) {
            // Hero image
            img.style.display = 'none';
            
            // Create placeholder
            const placeholder = document.createElement('div');
            placeholder.className = 'hero-image-placeholder';
            placeholder.innerHTML = '<i class="fas fa-book-open"></i>';
            
            // Insert after image
            img.parentNode.insertBefore(placeholder, img.nextSibling);
          } else if (img.classList.contains('testimonial-image')) {
            // Testimonial image
            img.style.display = 'none';
            
            // Create placeholder
            const placeholder = document.createElement('div');
            placeholder.className = 'testimonial-image-placeholder';
            placeholder.innerHTML = '<i class="fas fa-user"></i>';
            
            // Insert after image
            img.parentNode.insertBefore(placeholder, img.nextSibling);
          } else {
            // Generic image
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="' + (img.width || 300) + '" height="' + (img.height || 200) + '" viewBox="0 0 300 200" preserveAspectRatio="none"%3E%3Crect width="300" height="200" fill="%23ecf0f1" /%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="%2395a5a6"%3EImage Not Found%3C/text%3E%3C/svg%3E';
            img.style.objectFit = 'cover';
          }
        };
        
        // Force check
        if (img.complete) {
          if (img.naturalHeight === 0) {
            img.onerror();
          }
        }
      });
    };
    
    // Public API
    return {
      createAvatarPlaceholder,
      handleMissingImages,
      createAvatarDataUrl,
      loadMissingImages
    };
  })();
  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    placeholderUtils.handleMissingImages();
  });