// notetaker_frontend/lib/ui/settings/account_screen.dart
import 'package:flutter/material.dart';
import '../../config/constants.dart';
import '../../models/user.dart';
import '../../notifiers/auth_notifier.dart';
import '../../services/tier_service.dart';
import '../shared/styles.dart';
import '../shared/widgets/app_button.dart';
import '../shared/widgets/app_text_field.dart';
import '../shared/widgets/loading_indicator.dart';

class AccountScreen extends StatefulWidget {
  final AuthNotifier authNotifier;
  final TierService tierService;
  
  const AccountScreen({
    Key? key,
    required this.authNotifier,
    required this.tierService,
  }) : super(key: key);

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _displayNameController;
  
  bool _isEditing = false;
  bool _isSaving = false;
  bool _isUpgrading = false;
  String? _error;
  
  @override
  void initState() {
    super.initState();
    _displayNameController = TextEditingController();
    _loadUserData();
  }
  
  void _loadUserData() {
    final user = widget.authNotifier.currentUser.value;
    if (user != null) {
      _displayNameController.text = user.displayName;
    }
  }
  
  @override
  void dispose() {
    _displayNameController.dispose();
    super.dispose();
  }
  
  Future<void> _saveProfile() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    
    setState(() {
      _isSaving = true;
      _error = null;
    });
    
    try {
      final user = widget.authNotifier.currentUser.value;
      if (user != null) {
        // Update profile through auth service
        await widget.authNotifier.updateProfile(
          user.id,
          {'displayName': _displayNameController.text.trim()}
        );
        
        if (mounted) {
          setState(() {
            _isEditing = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Profile updated successfully')),
          );
        }
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to update profile: $e';
      });
      print(_error);
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }
  
  Future<void> _upgradeToPro() async {
    setState(() {
      _isUpgrading = true;
      _error = null;
    });
    
    try {
      final user = widget.authNotifier.currentUser.value;
      if (user != null) {
        // In a real app, this would show payment flow
        // For demo, just upgrade directly
        final success = await widget.tierService.upgradeTier(user.id, 'pro');
        
        if (success && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Account upgraded to Pro!')),
          );
        }
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to upgrade account: $e';
      });
      print(_error);
    } finally {
      if (mounted) {
        setState(() {
          _isUpgrading = false;
        });
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Account'),
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () => setState(() => _isEditing = true),
            ),
        ],
      ),
      body: ValueListenableBuilder<User?>(
        valueListenable: widget.authNotifier.currentUser,
        builder: (context, user, _) {
          if (user == null) {
            return const Center(child: Text('Not logged in'));
          }
          
          return SingleChildScrollView(
            padding: Paddings.page,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildProfileSection(user),
                const SizedBox(height: AppTheme.spacingL),
                _buildSubscriptionSection(user),
                const SizedBox(height: AppTheme.spacingL),
                _buildUsageSection(user),
              ],
            ),
          );
        },
      ),
    );
  }
  
  Widget _buildProfileSection(User user) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusM),
      ),
      child: Padding(
        padding: Paddings.card,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Profile Information',
              style: TextStyles.heading3,
            ),
            const SizedBox(height: AppTheme.spacingM),
            if (_isEditing) ...[
              Form(
                key: _formKey,
                child: Column(
                  children: [
                    AppTextField(
                      label: AppStrings.displayName,
                      controller: _displayNameController,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your name';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: AppTheme.spacingM),
                    if (_error != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: AppTheme.spacingM),
                        child: Text(
                          _error!,
                          style: const TextStyle(color: AppTheme.error),
                        ),
                      ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () => setState(() => _isEditing = false),
                          child: const Text(AppStrings.cancel),
                        ),
                        const SizedBox(width: AppTheme.spacingM),
                        AppButton(
                          label: AppStrings.save,
                          onPressed: _saveProfile,
                          isLoading: _isSaving,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ] else ...[
              _buildInfoRow('Name', user.displayName),
              _buildInfoRow('Email', user.email),
              _buildInfoRow('Account Created', _formatDate(user.createdAt)),
              _buildInfoRow('Last Login', _formatDate(user.lastLoginAt)),
            ],
          ],
        ),
      ),
    );
  }
  
  Widget _buildSubscriptionSection(User user) {
    final isPro = user.accountTier == 'pro';
    
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusM),
      ),
      child: Padding(
        padding: Paddings.card,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Subscription Plan',
              style: TextStyles.heading3,
            ),
            const SizedBox(height: AppTheme.spacingM),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppTheme.spacingS,
                    vertical: AppTheme.spacingXs,
                  ),
                  decoration: BoxDecoration(
                    color: isPro ? AppTheme.success.withOpacity(0.2) : AppTheme.secondaryColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(AppTheme.radiusXs),
                  ),
                  child: Text(
                    isPro ? 'PRO' : 'FREE',
                    style: TextStyle(
                      color: isPro ? AppTheme.success : AppTheme.secondaryColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(width: AppTheme.spacingM),
                Text(
                  isPro ? 'Unlimited plan' : 'Basic plan',
                  style: TextStyles.bodyLarge,
                ),
              ],
            ),
            const SizedBox(height: AppTheme.spacingM),
            _buildPlanFeatures(isPro),
            const SizedBox(height: AppTheme.spacingM),
            if (!isPro)
              AppButton(
                label: 'Upgrade to Pro',
                onPressed: _upgradeToPro,
                isLoading: _isUpgrading,
                fullWidth: true,
              ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildPlanFeatures(bool isPro) {
    return Column(
      children: [
        _buildFeatureRow('Modules', isPro ? 'Unlimited' : '2 max'),
        _buildFeatureRow('Notes per module', isPro ? 'Unlimited' : '10 max'),
        _buildFeatureRow('Storage', isPro ? '5 GB' : '50 MB'),
        _buildFeatureRow('Advanced editor', isPro ? 'Included' : 'Not available'),
        _buildFeatureRow('Export options', isPro ? 'Included' : 'Not available'),
      ],
    );
  }
  
  Widget _buildUsageSection(User user) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radiusM),
      ),
      child: Padding(
        padding: Paddings.card,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Usage Statistics',
              style: TextStyles.heading3,
            ),
            const SizedBox(height: AppTheme.spacingM),
            _buildUsageRow(
              'Modules',
              '${user.moduleCount} / ${user.moduleLimit == 999999 ? '∞' : user.moduleLimit}',
              value: user.moduleLimit == 999999 ? 0 : user.moduleCount / user.moduleLimit,
            ),
            const SizedBox(height: AppTheme.spacingM),
            _buildUsageRow(
              'Notes',
              user.noteCount.toString(),
            ),
            const SizedBox(height: AppTheme.spacingM),
            _buildUsageRow(
              'Storage',
              '${user.storageUsageFormatted} / ${user.storageLimitFormatted}',
              value: user.storageUsagePercentage / 100,
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.spacingM),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyles.bodySmall.copyWith(
                color: AppTheme.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyles.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildFeatureRow(String feature, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.spacingS),
      child: Row(
        children: [
          const Icon(
            Icons.check_circle_outline,
            color: AppTheme.success,
            size: 16,
          ),
          const SizedBox(width: AppTheme.spacingS),
          Expanded(
            child: Text(
              feature,
              style: TextStyles.bodyMedium,
            ),
          ),
          Text(
            value,
            style: TextStyles.bodySmall.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildUsageRow(String label, String value, {double? value}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyles.bodyMedium,
            ),
            Text(
              value,
              style: TextStyles.bodySmall.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        if (value != null) ...[
          const SizedBox(height: AppTheme.spacingXs),
          LinearProgressIndicator(
            value: value,
            backgroundColor: AppTheme.surfaceColor,
            valueColor: AlwaysStoppedAnimation<Color>(
              value > 0.9 ? AppTheme.warning : AppTheme.primaryColor,
            ),
          ),
        ],
      ],
    );
  }
  
  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}