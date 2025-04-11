// notetaker_frontend/lib/ui/settings/settings_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/constants.dart';
import '../../models/user.dart';
import '../../notifiers/auth_notifier.dart';
import '../../notifiers/theme_notifier.dart';
import '../shared/styles.dart';

class SettingsScreen extends StatelessWidget {
  final AuthNotifier authNotifier;
  final ThemeNotifier themeNotifier;
  
  const SettingsScreen({
    Key? key,
    required this.authNotifier,
    required this.themeNotifier,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.settings),
      ),
      body: ValueListenableBuilder<User?>(
        valueListenable: authNotifier.currentUser,
        builder: (context, user, _) {
          if (user == null) {
            return const Center(child: Text('Not logged in'));
          }
          
          return ListView(
            children: [
              _buildSection(
                title: 'Account',
                children: [
                  _buildListTile(
                    title: 'Profile',
                    subtitle: user.email,
                    icon: Icons.person,
                    onTap: () => context.push('${AppRoutes.settings}/account'),
                  ),
                  _buildListTile(
                    title: 'Account Tier',
                    subtitle: '${user.accountTier.toUpperCase()} - ${user.moduleLimit} modules, ${user.storageLimitFormatted} storage',
                    icon: Icons.card_membership,
                    onTap: () => context.push('${AppRoutes.settings}/account'),
                  ),
                ],
              ),
              _buildSection(
                title: 'Appearance',
                children: [
                  ValueListenableBuilder<ThemeMode>(
                    valueListenable: themeNotifier.themeMode,
                    builder: (context, themeMode, _) {
                      return _buildListTile(
                        title: AppStrings.theme,
                        subtitle: themeMode == ThemeMode.light ? 'Light mode' : 'Dark mode',
                        icon: themeMode == ThemeMode.light ? Icons.light_mode : Icons.dark_mode,
                        onTap: () => context.push('${AppRoutes.settings}/theme'),
                      );
                    }
                  ),
                ],
              ),
              _buildSection(
                title: 'About',
                children: [
                  _buildListTile(
                    title: 'Version',
                    subtitle: '1.0.0',
                    icon: Icons.info_outline,
                    onTap: () {},
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.spacingL),
              Padding(
                padding: Paddings.page,
                child: ElevatedButton(
                  onPressed: () => _confirmLogout(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.error,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingM),
                  ),
                  child: const Text(AppStrings.logout),
                ),
              ),
              const SizedBox(height: AppTheme.spacingM),
              Center(
                child: TextButton(
                  onPressed: () => _confirmDeleteAccount(context),
                  style: TextButton.styleFrom(
                    foregroundColor: AppTheme.error,
                  ),
                  child: const Text(
                    AppStrings.deleteAccount,
                    style: TextStyle(
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: AppTheme.spacingL),
            ],
          );
        },
      ),
    );
  }
  
  Widget _buildSection({required String title, required List<Widget> children}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(
            left: AppTheme.spacingL,
            right: AppTheme.spacingL,
            top: AppTheme.spacingL,
            bottom: AppTheme.spacingS,
          ),
          child: Text(
            title,
            style: TextStyle(
              color: AppTheme.primaryColor,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ),
        ...children,
        const Divider(height: AppTheme.spacingL),
      ],
    );
  }
  
  Widget _buildListTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primaryColor),
      title: Text(title, style: TextStyles.bodyLarge),
      subtitle: Text(subtitle, style: TextStyles.bodySmall),
      trailing: const Icon(Icons.chevron_right, size: 20),
      onTap: onTap,
    );
  }
  
  Future<void> _confirmLogout(BuildContext context) async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Logout'),
          content: const Text('Are you sure you want to log out?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text(AppStrings.cancel),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
              ),
              child: const Text(AppStrings.logout),
            ),
          ],
        );
      },
    );
    
    if (shouldLogout == true) {
      await authNotifier.signOut();
      if (context.mounted) {
        context.go(AppRoutes.login);
      }
    }
  }
  
  Future<void> _confirmDeleteAccount(BuildContext context) async {
    final shouldDelete = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text(AppStrings.deleteAccount),
          content: const Text(
            'Are you sure you want to delete your account? This action cannot be undone, and all your data will be permanently lost.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text(AppStrings.cancel),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.error,
              ),
              child: const Text(AppStrings.delete),
            ),
          ],
        );
      },
    );
    
    if (shouldDelete == true) {
      // Implement account deletion
      // TODO: Add actual implementation through AuthNotifier
      await authNotifier.signOut();
      if (context.mounted) {
        context.go(AppRoutes.login);
      }
    }
  }
}