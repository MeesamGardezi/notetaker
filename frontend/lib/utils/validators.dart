class Validators {
  /// Validates an email address
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    
    // Simple email regex pattern
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    
    if (!emailRegex.hasMatch(value)) {
      return 'Enter a valid email address';
    }
    
    return null;
  }
  
  /// Validates a password
  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    
    if (value.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    
    // Check for at least one uppercase letter
    if (!RegExp(r'[A-Z]').hasMatch(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    
    // Check for at least one number
    if (!RegExp(r'[0-9]').hasMatch(value)) {
      return 'Password must contain at least one number';
    }
    
    return null;
  }
  
  /// Validates the confirm password field
  static String? validateConfirmPassword(String? value, String password) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }
    
    if (value != password) {
      return 'Passwords do not match';
    }
    
    return null;
  }
  
  /// Validates a user's display name
  static String? validateName(String? value) {
    if (value == null || value.isEmpty) {
      return 'Name is required';
    }
    
    if (value.length < 2) {
      return 'Name must be at least 2 characters long';
    }
    
    if (value.length > 50) {
      return 'Name must be less than 50 characters long';
    }
    
    return null;
  }
  
  /// Validates a module title
  static String? validateModuleTitle(String? value) {
    if (value == null || value.isEmpty) {
      return 'Title is required';
    }
    
    if (value.length > 100) {
      return 'Title must be less than 100 characters long';
    }
    
    return null;
  }
  
  /// Validates a note title
  static String? validateNoteTitle(String? value) {
    if (value == null || value.isEmpty) {
      return 'Title is required';
    }
    
    if (value.length > 200) {
      return 'Title must be less than 200 characters long';
    }
    
    return null;
  }
  
  /// Validates a tag name
  static String? validateTagName(String? value) {
    if (value == null || value.isEmpty) {
      return 'Tag name is required';
    }
    
    if (value.length > 50) {
      return 'Tag name must be less than 50 characters long';
    }
    
    return null;
  }
  
  /// Validates a color hex code
  static String? validateHexColor(String? value) {
    if (value == null || value.isEmpty) {
      return null; // Color is optional
    }
    
    // Check if value is a valid hex color
    final hexColorRegex = RegExp(r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$');
    
    if (!hexColorRegex.hasMatch(value)) {
      return 'Invalid color format. Use #RRGGBB or #RGB';
    }
    
    return null;
  }
  
  /// Validates a search query
  static String? validateSearchQuery(String? value) {
    if (value == null || value.isEmpty) {
      return 'Search query is required';
    }
    
    if (value.length < 2) {
      return 'Search query must be at least 2 characters long';
    }
    
    return null;
  }
}