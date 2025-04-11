import 'package:flutter/material.dart';
import '../state/app_state.dart';
import '../state/auth_state.dart';
import '../widgets/custom_app_bar.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late AppState _appState;
  late AuthState _authState;
  
  bool _isLoading = false;
  String? _message;
  bool _isError = false;
  
  @override
  void initState() {
    super.initState();
    _initializeStates();
  }
  
  void _initializeStates() async {
    // Get auth state using static method
    _authState = AuthState.of(context);
    
    // Create app state
    _appState = AppState(
      authState: _authState, 
      apiService: _authState.apiService,
      storageService: _authState.storageService,
    );
  }
  
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = _authState.user;
    
    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Settings',
        showBackButton: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Message card (if any)
                if (_message != null) ...[
                  Card(
                    color: _isError
                        ? theme.colorScheme.errorContainer
                        : theme.colorScheme.primaryContainer,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        _message!,
                        style: TextStyle(
                          color: _isError
                              ? theme.colorScheme.onErrorContainer
                              : theme.colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                
                // Appearance settings
                _buildSectionHeader('Appearance'),
                
                // Theme mode
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Theme',
                          style: theme.textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        ValueListenableBuilder<bool>(
                          valueListenable: appState.isDarkMode,
                          builder: (context, isDarkMode, child) {
                            return SegmentedButton<String>(
                              segments: const [
                                ButtonSegment(
                                  value: 'light',
                                  icon: Icon(Icons.light_mode),
                                  label: Text('Light'),
                                ),
                                ButtonSegment(
                                  value: 'system',
                                  icon: Icon(Icons.brightness_auto),
                                  label: Text('System'),
                                ),
                                ButtonSegment(
                                  value: 'dark',
                                  icon: Icon(Icons.dark_mode),
                                  label: Text('Dark'),
                                ),
                              ],
                              selected: {
                                isDarkMode ? 'dark' : (user?.getThemePreference() == 'system' ? 'system' : 'light')
                              },
                              onSelectionChanged: (selection) {
                                if (selection.isEmpty) return;
                                
                                final value = selection.first;
                                _updateTheme(value);
                              },
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Font size
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Font Size',
                          style: theme.textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        ValueListenableBuilder<double>(
                          valueListenable: appState.textScaleFactor,
                          builder: (context, scaleFactor, child) {
                            return Column(
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.text_fields, size: 18),
                                    Expanded(
                                      child: Slider(
                                        value: scaleFactor,
                                        min: 0.8,
                                        max: 1.4,
                                        divisions: 6,
                                        label: '${(scaleFactor * 100).round()}%',
                                        onChanged: (value) {
                                          appState.updateTextScaleFactor(value);
                                        },
                                      ),
                                    ),
                                    const Icon(Icons.text_fields, size: 24),
                                  ],
                                ),
                                Text(
                                  'Sample Text',
                                  style: theme.textTheme.bodyLarge?.copyWith(
                                    fontSize: 16 * scaleFactor,
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Account settings
                _buildSectionHeader('Account'),
                
                // User info card
                Card(
                  child: Column(
                    children: [
                      // User info
                      ListTile(
                        leading: CircleAvatar(
                          backgroundColor: theme.colorScheme.primary,
                          child: Text(
                            (user?.displayName?.isNotEmpty == true)
                                ? user!.displayName[0].toUpperCase()
                                : 'U',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        title: Text(user?.displayName ?? 'User'),
                        subtitle: Text(user?.email ?? 'user@example.com'),
                      ),
                      
                      const Divider(),
                      
                      // Subscription tier
                      ListTile(
                        leading: Icon(
                          user?.isPremium == true
                              ? Icons.workspace_premium
                              : Icons.star_border,
                          color: user?.isPremium == true
                              ? Colors.amber
                              : null,
                        ),
                        title: Text(
                          user?.isPremium == true
                              ? 'Premium Tier'
                              : 'Free Tier',
                        ),
                        subtitle: Text(
                          user?.isPremium == true
                              ? 'Enjoy unlimited access to all features'
                              : 'Upgrade to premium for more features',
                        ),
                        trailing: user?.isPremium != true
                            ? TextButton(
                                onPressed: () {
                                  _showUpgradeDialog();
                                },
                                child: const Text('Upgrade'),
                              )
                            : null,
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Password change
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.lock_outline),
                    title: const Text('Change Password'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      _showChangePasswordDialog();
                    },
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Data management
                _buildSectionHeader('Data Management'),
                
                // Clear cache
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.cleaning_services_outlined),
                    title: const Text('Clear Cache'),
                    subtitle: const Text('Free up space by clearing temporary files'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      _showClearCacheDialog();
                    },
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Export data
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.download_outlined),
                    title: const Text('Export Data'),
                    subtitle: const Text('Download your notes and data'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      _showComingSoonDialog('Export Data');
                    },
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // About section
                _buildSectionHeader('About'),
                
                // App info
                Card(
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.info_outline),
                        title: const Text('Version'),
                        trailing: const Text('1.0.0'),
                      ),
                      const Divider(),
                      ListTile(
                        leading: const Icon(Icons.policy_outlined),
                        title: const Text('Privacy Policy'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          _showComingSoonDialog('Privacy Policy');
                        },
                      ),
                      const Divider(),
                      ListTile(
                        leading: const Icon(Icons.description_outlined),
                        title: const Text('Terms of Service'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          _showComingSoonDialog('Terms of Service');
                        },
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Logout button
                ElevatedButton.icon(
                  onPressed: _confirmLogout,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: theme.colorScheme.errorContainer,
                    foregroundColor: theme.colorScheme.onErrorContainer,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  icon: const Icon(Icons.logout),
                  label: const Text('Logout'),
                ),
                
                const SizedBox(height: 32),
              ],
            ),
    );
  }
  
  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, bottom: 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }
  
  void _updateTheme(String theme) async {
    setState(() {
      _isLoading = true;
      _message = null;
    });
    
    try {
      if (theme == 'dark') {
        if (!_appState.isDarkMode.value) {
          await _appState.toggleDarkMode();
        }
      } else if (theme == 'light') {
        if (_appState.isDarkMode.value) {
          await _appState.toggleDarkMode();
        }
      } else {
        // System theme
        final settings = {...?_authState.user?.settings};
        settings['theme'] = 'system';
        
        // Update user settings
        await _authState.updateProfile(settings: settings);
      }
      
      setState(() {
        _isLoading = false;
        _message = 'Theme updated successfully';
        _isError = false;
      });
      
      // Clear message after a delay
      _clearMessageAfterDelay();
    } catch (e) {
      setState(() {
        _isLoading = false;
        _message = 'Failed to update theme: ${e.toString()}';
        _isError = true;
      });
    }
  }
  
  void _clearMessageAfterDelay() {
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _message = null;
        });
      }
    });
  }
  
  void _showUpgradeDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Upgrade to Premium'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Unlock premium features:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildFeatureRow(Icons.folder, 'Unlimited modules'),
            const SizedBox(height: 8),
            _buildFeatureRow(Icons.note, 'Unlimited notes per module'),
            const SizedBox(height: 8),
            _buildFeatureRow(Icons.tag, 'Unlimited tags'),
            const SizedBox(height: 8),
            _buildFeatureRow(Icons.image, 'Larger image uploads (50MB)'),
            const SizedBox(height: 16),
            const Text(
              'Premium: \$4.99/month',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Maybe Later'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _showComingSoonDialog('Premium Upgrade');
            },
            child: const Text('Upgrade Now'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildFeatureRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: 8),
        Expanded(child: Text(text)),
      ],
    );
  }
  
  void _showChangePasswordDialog() {
    final formKey = GlobalKey<FormState>();
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    bool obscureCurrentPassword = true;
    bool obscureNewPassword = true;
    bool obscureConfirmPassword = true;
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Change Password'),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: currentPasswordController,
                  decoration: InputDecoration(
                    labelText: 'Current Password',
                    suffixIcon: IconButton(
                      icon: Icon(
                        obscureCurrentPassword ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed: () {
                        setState(() {
                          obscureCurrentPassword = !obscureCurrentPassword;
                        });
                      },
                    ),
                  ),
                  obscureText: obscureCurrentPassword,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your current password';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: newPasswordController,
                  decoration: InputDecoration(
                    labelText: 'New Password',
                    suffixIcon: IconButton(
                      icon: Icon(
                        obscureNewPassword ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed: () {
                        setState(() {
                          obscureNewPassword = !obscureNewPassword;
                        });
                      },
                    ),
                  ),
                  obscureText: obscureNewPassword,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a new password';
                    }
                    if (value.length < 8) {
                      return 'Password must be at least 8 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: confirmPasswordController,
                  decoration: InputDecoration(
                    labelText: 'Confirm New Password',
                    suffixIcon: IconButton(
                      icon: Icon(
                        obscureConfirmPassword ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed: () {
                        setState(() {
                          obscureConfirmPassword = !obscureConfirmPassword;
                        });
                      },
                    ),
                  ),
                  obscureText: obscureConfirmPassword,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please confirm your new password';
                    }
                    if (value != newPasswordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (formKey.currentState!.validate()) {
                  Navigator.pop(context);
                  _changePassword(
                    currentPasswordController.text,
                    newPasswordController.text,
                  );
                }
              },
              child: const Text('Change Password'),
            ),
          ],
        ),
      ),
    );
  }
  
  Future<void> _changePassword(String currentPassword, String newPassword) async {
    setState(() {
      _isLoading = true;
      _message = null;
    });
    
    try {
      final success = await _authState.changePassword(
        currentPassword,
        newPassword,
      );
      
      setState(() {
        _isLoading = false;
        if (success) {
          _message = 'Password changed successfully';
          _isError = false;
        } else {
          _message = 'Failed to change password. Please check your current password.';
          _isError = true;
        }
      });
      
      _clearMessageAfterDelay();
    } catch (e) {
      setState(() {
        _isLoading = false;
        _message = 'Error changing password: ${e.toString()}';
        _isError = true;
      });
    }
  }
  
  void _showClearCacheDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Cache'),
        content: const Text(
          'This will clear temporary data and cached images. '
          'Your notes and data will not be deleted.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _clearCache();
            },
            child: const Text('Clear Cache'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _clearCache() async {
    setState(() {
      _isLoading = true;
      _message = null;
    });
    
    try {
      await _authState.storageService.clearCache();
      
      setState(() {
        _isLoading = false;
        _message = 'Cache cleared successfully';
        _isError = false;
      });
      
      _clearMessageAfterDelay();
    } catch (e) {
      setState(() {
        _isLoading = false;
        _message = 'Error clearing cache: ${e.toString()}';
        _isError = true;
      });
    }
  }
  
  void _showComingSoonDialog(String feature) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('$feature Coming Soon'),
        content: Text(
          'The $feature feature is coming soon! '
          'We\'re working hard to bring you this functionality.',
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
  
  void _confirmLogout() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _logout();
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _logout() async {
    setState(() {
      _isLoading = true;
    });
    
    try {
      await _authState.logout();
    } catch (e) {
      // Errors during logout are handled by AuthState
    }
  }
}