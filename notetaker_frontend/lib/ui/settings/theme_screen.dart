// notetaker_frontend/lib/ui/settings/theme_screen.dart
import 'package:flutter/material.dart';
import '../../config/constants.dart';
import '../../notifiers/theme_notifier.dart';
import '../shared/styles.dart';

class ThemeScreen extends StatelessWidget {
  final ThemeNotifier themeNotifier;
  
  const ThemeScreen({
    Key? key,
    required this.themeNotifier,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.theme),
      ),
      body: ValueListenableBuilder<ThemeMode>(
        valueListenable: themeNotifier.themeMode,
        builder: (context, currentThemeMode, _) {
          return Column(
            children: [
              const SizedBox(height: AppTheme.spacingM),
              _buildThemeOption(
                context: context,
                title: 'Light',
                description: 'Light background with dark text',
                icon: Icons.light_mode,
                isSelected: currentThemeMode == ThemeMode.light,
                onTap: () => themeNotifier.setThemeMode(ThemeMode.light),
              ),
              const Divider(indent: 72),
              _buildThemeOption(
                context: context,
                title: 'Dark',
                description: 'Dark background with light text',
                icon: Icons.dark_mode,
                isSelected: currentThemeMode == ThemeMode.dark,
                onTap: () => themeNotifier.setThemeMode(ThemeMode.dark),
              ),
              const Divider(indent: 72),
              _buildThemeOption(
                context: context,
                title: 'System',
                description: 'Follow system theme settings',
                icon: Icons.settings_suggest,
                isSelected: currentThemeMode == ThemeMode.system,
                onTap: () => themeNotifier.setThemeMode(ThemeMode.system),
              ),
              const Divider(indent: 72),
              const SizedBox(height: AppTheme.spacingL),
              Padding(
                padding: Paddings.page,
                child: _buildThemePreview(currentThemeMode),
              ),
            ],
          );
        },
      ),
    );
  }
  
  Widget _buildThemeOption({
    required BuildContext context,
    required String title,
    required String description,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
        size: 28,
      ),
      title: Text(
        title,
        style: TextStyles.bodyLarge.copyWith(
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? AppTheme.primaryColor : AppTheme.textPrimary,
        ),
      ),
      subtitle: Text(
        description,
        style: TextStyles.bodySmall,
      ),
      trailing: isSelected
          ? const Icon(
              Icons.check_circle,
              color: AppTheme.primaryColor,
            )
          : null,
      onTap: onTap,
    );
  }
  
  Widget _buildThemePreview(ThemeMode themeMode) {
    final isDark = themeMode == ThemeMode.dark;
    final backgroundColor = isDark ? const Color(0xFF121212) : AppTheme.background;
    final cardColor = isDark ? const Color(0xFF1E1E1E) : AppTheme.cardBackground;
    final textColor = isDark ? Colors.white : AppTheme.textPrimary;
    final secondaryTextColor = isDark ? Colors.white70 : AppTheme.textSecondary;
    
    return Container(
      padding: Paddings.card,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(AppTheme.radiusM),
        border: Border.all(
          color: isDark ? Colors.white24 : AppTheme.surfaceColor,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Theme Preview',
            style: TextStyles.heading3.copyWith(color: textColor),
          ),
          const SizedBox(height: AppTheme.spacingM),
          Container(
            padding: Paddings.card,
            decoration: BoxDecoration(
              color: cardColor,
              borderRadius: BorderRadius.circular(AppTheme.radiusS),
              border: Border.all(
                color: isDark ? Colors.white12 : AppTheme.surfaceColor,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'This is how your app will look',
                  style: TextStyles.bodyLarge.copyWith(color: textColor),
                ),
                const SizedBox(height: AppTheme.spacingS),
                Text(
                  'Secondary text and details will appear like this.',
                  style: TextStyles.bodySmall.copyWith(color: secondaryTextColor),
                ),
                const SizedBox(height: AppTheme.spacingM),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppTheme.spacingM,
                        vertical: AppTheme.spacingS,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor,
                        borderRadius: BorderRadius.circular(AppTheme.radiusS),
                      ),
                      child: const Text(
                        'Button',
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                    Icon(
                      Icons.bookmark,
                      color: AppTheme.primaryColor,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}