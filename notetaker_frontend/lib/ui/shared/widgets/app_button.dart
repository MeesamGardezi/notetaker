// notetaker_frontend/lib/ui/shared/widgets/app_button.dart
import 'package:flutter/material.dart';
import '../../../config/constants.dart';

enum AppButtonType { primary, secondary, text }

class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final AppButtonType type;
  final bool isLoading;
  final bool fullWidth;
  final IconData? icon;
  final double? minWidth;
  final double? height;
  
  const AppButton({
    Key? key,
    required this.label,
    this.onPressed,
    this.type = AppButtonType.primary,
    this.isLoading = false,
    this.fullWidth = false,
    this.icon,
    this.minWidth,
    this.height,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    switch (type) {
      case AppButtonType.primary:
        return _buildElevatedButton();
      case AppButtonType.secondary:
        return _buildOutlinedButton();
      case AppButtonType.text:
        return _buildTextButton();
    }
  }
  
  Widget _buildElevatedButton() {
    return SizedBox(
      width: fullWidth ? double.infinity : minWidth,
      height: height ?? 48,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primaryColor,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(
            horizontal: AppTheme.spacingL,
            vertical: AppTheme.spacingM,
          ),
        ),
        child: _buildButtonContent(Colors.white),
      ),
    );
  }
  
  Widget _buildOutlinedButton() {
    return SizedBox(
      width: fullWidth ? double.infinity : minWidth,
      height: height ?? 48,
      child: OutlinedButton(
        onPressed: isLoading ? null : onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppTheme.primaryColor,
          side: const BorderSide(color: AppTheme.primaryColor),
          padding: const EdgeInsets.symmetric(
            horizontal: AppTheme.spacingL,
            vertical: AppTheme.spacingM,
          ),
        ),
        child: _buildButtonContent(AppTheme.primaryColor),
      ),
    );
  }
  
  Widget _buildTextButton() {
    return TextButton(
      onPressed: isLoading ? null : onPressed,
      style: TextButton.styleFrom(
        foregroundColor: AppTheme.primaryColor,
        padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingM,
          vertical: AppTheme.spacingS,
        ),
      ),
      child: _buildButtonContent(AppTheme.primaryColor),
    );
  }
  
  Widget _buildButtonContent(Color color) {
    if (isLoading) {
      return SizedBox(
        width: 24,
        height: 24,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(color),
        ),
      );
    }
    
    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 18),
          const SizedBox(width: AppTheme.spacingS),
          Text(label),
        ],
      );
    }
    
    return Text(label);
  }
}