import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../state/auth_state.dart';
import '../widgets/custom_app_bar.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late AuthState _authState;
  
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _displayNameController;
  
  bool _isLoading = false;
  String? _successMessage;
  String? _errorMessage;
  
  @override
  void initState() {
    super.initState();
    _initializeState();
  }
  
  void _initializeState() {
    // Get auth state
    _authState = AuthState.of(context);
    
    // Initialize controllers
    _displayNameController = TextEditingController(
      text: _authState.user?.displayName ?? '',
    );
  }
  
  Future<void> _updateProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    
    setState(() {
      _isLoading = true;
      _successMessage = null;
      _errorMessage = null;
    });
    
    try {
      final displayName = _displayNameController.text.trim();
      
      final success = await _authState.updateProfile(
        displayName: displayName,
      );
      
      setState(() {
        _isLoading = false;
        if (success) {
          _successMessage = 'Profile updated successfully';
        } else {
          _errorMessage = 'Failed to update profile';
        }
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Error updating profile: ${e.toString()}';
      });
    }
  }
  
  @override
  void dispose() {
    _displayNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Profile',
        showBackButton: true,
      ),
      body: ValueListenableBuilder<UserModel?>(
        valueListenable: _authState,
        builder: (context, user, child) {
          if (user == null) {
            return const Center(
              child: Text('User not logged in'),
            );
          }
          
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Profile avatar
                Hero(
                  tag: 'profile-avatar',
                  child: CircleAvatar(
                    radius: 60,
                    backgroundColor: theme.colorScheme.primary,
                    child: Text(
                      user.displayName.isNotEmpty
                          ? user.displayName[0].toUpperCase()
                          : 'U',
                      style: const TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Email
                Text(
                  user.email,
                  style: theme.textTheme.titleMedium,
                ),
                
                const SizedBox(height: 8),
                
                // Subscription info
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: user.isPremium
                        ? Colors.amber.withOpacity(0.2)
                        : theme.colorScheme.secondaryContainer,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        user.isPremium
                            ? Icons.workspace_premium
                            : Icons.star_border,
                        color: user.isPremium
                            ? Colors.amber
                            : theme.colorScheme.secondary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        user.isPremium ? 'Premium' : 'Free',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: user.isPremium
                              ? Colors.amber.shade800
                              : theme.colorScheme.secondary,
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Success/error messages
                if (_successMessage != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.green),
                    ),
                    child: Text(
                      _successMessage!,
                      style: const TextStyle(color: Colors.green),
                    ),
                  ),
                
                if (_errorMessage != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.error.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: theme.colorScheme.error),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: TextStyle(color: theme.colorScheme.error),
                    ),
                  ),
                
                if (_successMessage != null || _errorMessage != null)
                  const SizedBox(height: 24),
                
                // Edit profile form
                Card(
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Edit Profile',
                            style: theme.textTheme.titleLarge,
                          ),
                          const SizedBox(height: 24),
                          
                          // Display name field
                          TextFormField(
                            controller: _displayNameController,
                            decoration: const InputDecoration(
                              labelText: 'Display Name',
                              hintText: 'Enter your name',
                              prefixIcon: Icon(Icons.person),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter a display name';
                              }
                              return null;
                            },
                          ),
                          
                          const SizedBox(height: 24),
                          
                          // Photo upload option (placeholder)
                          Row(
                            children: [
                              const Icon(Icons.photo_camera),
                              const SizedBox(width: 8),
                              TextButton(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Photo upload not implemented yet'),
                                    ),
                                  );
                                },
                                child: const Text('Change Profile Photo'),
                              ),
                            ],
                          ),
                          
                          const SizedBox(height: 24),
                          
                          // Submit button
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _isLoading ? null : _updateProfile,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                              child: _isLoading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Text('Save Changes'),
                            ),
                          ),
                          
                          const SizedBox(height: 16),
                          
                          // Cancel button
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton(
                              onPressed: () {
                                // Reset form
                                _displayNameController.text = user.displayName;
                                setState(() {
                                  _successMessage = null;
                                  _errorMessage = null;
                                });
                              },
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                              child: const Text('Reset'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Account stats
                Card(
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Account Info',
                          style: theme.textTheme.titleLarge,
                        ),
                        const SizedBox(height: 16),
                        
                        _buildInfoRow(
                          icon: Icons.calendar_today,
                          title: 'Account Created',
                          value: _formatDate(user.createdAt),
                        ),
                        
                        const Divider(height: 24),
                        
                        _buildInfoRow(
                          icon: Icons.login,
                          title: 'Last Login',
                          value: _formatDate(user.lastLoginAt),
                        ),
                        
                        if (!user.isPremium) ...[
                          const Divider(height: 24),
                          
                          _buildInfoRow(
                            icon: Icons.folder,
                            title: 'Modules Limit',
                            value: '${user.maxModules} modules',
                          ),
                          
                          const Divider(height: 24),
                          
                          _buildInfoRow(
                            icon: Icons.note,
                            title: 'Notes Limit',
                            value: '${user.maxNotesPerModule} per module',
                          ),
                          
                          const SizedBox(height: 16),
                          
                          // Upgrade button
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Upgrade not implemented yet'),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.star),
                              label: const Text('Upgrade to Premium'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.amber,
                                foregroundColor: Colors.black87,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
  
  Widget _buildInfoRow({
    required IconData icon,
    required String title,
    required String value,
  }) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
  
  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
}