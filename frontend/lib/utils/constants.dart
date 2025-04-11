// API Constants
const String API_BASE_URL = 'http://localhost:3000';
const int API_TIMEOUT = 10000; // 10 seconds

// Storage Keys
const String STORAGE_AUTH_TOKEN_KEY = 'auth_token';
const String STORAGE_USER_DATA_KEY = 'user_data';
const String STORAGE_THEME_KEY = 'app_theme';

// Default Values
const double DEFAULT_FONT_SIZE = 16.0;
const String DEFAULT_THEME = 'system';

// Editor Constants
const int MAX_TITLE_LENGTH = 200;
const int MAX_CONTENT_LENGTH = 50000;
const int MAX_TAGS_PER_NOTE = 10;

// Tiers and Limits
class TierLimits {
  static const Map<String, dynamic> FREE = {
    'maxModules': 2,
    'maxNotesPerModule': 10,
    'maxTags': 20,
    'maxImageSizeBytes': 5 * 1024 * 1024, // 5MB
  };
  
  static const Map<String, dynamic> PREMIUM = {
    'maxModules': 999,
    'maxNotesPerModule': 999,
    'maxTags': 999,
    'maxImageSizeBytes': 50 * 1024 * 1024, // 50MB
  };
}

// Animation Durations
const Duration ANIMATION_DURATION_SHORT = Duration(milliseconds: 150);
const Duration ANIMATION_DURATION_MEDIUM = Duration(milliseconds: 300);
const Duration ANIMATION_DURATION_LONG = Duration(milliseconds: 500);

// Error Messages
const String ERROR_CONNECTION = 'Could not connect to server. Please check your internet connection.';
const String ERROR_TIMEOUT = 'Connection timed out. Please try again.';
const String ERROR_UNAUTHORIZED = 'Your session has expired. Please log in again.';
const String ERROR_SERVER = 'Server error. Please try again later.';
const String ERROR_UNKNOWN = 'An unknown error occurred. Please try again.';

// Success Messages
const String SUCCESS_SAVE = 'Successfully saved.';
const String SUCCESS_UPDATE = 'Successfully updated.';
const String SUCCESS_DELETE = 'Successfully deleted.';
const String SUCCESS_CREATE = 'Successfully created.';

// Module Colors
const List<Map<String, dynamic>> MODULE_COLORS = [
  {'name': 'Blue', 'value': '#3F51B5'},
  {'name': 'Indigo', 'value': '#303F9F'},
  {'name': 'Purple', 'value': '#9C27B0'},
  {'name': 'Pink', 'value': '#E91E63'},
  {'name': 'Red', 'value': '#F44336'},
  {'name': 'Orange', 'value': '#FF9800'},
  {'name': 'Yellow', 'value': '#FFC107'},
  {'name': 'Green', 'value': '#4CAF50'},
  {'name': 'Teal', 'value': '#009688'},
  {'name': 'Cyan', 'value': '#00BCD4'},
];

// Module Icons
const List<String> MODULE_ICONS = [
  'book',
  'note',
  'folder',
  'star',
  'favorite',
  'work',
  'school',
  'home',
  'business',
  'code',
  'science',
  'history',
  'language',
  'art',
  'music',
];