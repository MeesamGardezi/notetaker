// notetaker_frontend/lib/ui/shared/styles.dart
import 'package:flutter/material.dart';
import '../../config/constants.dart';

// Shared text styles
class TextStyles {
  static const heading1 = AppTheme.headingLarge;
  static const heading2 = AppTheme.headingMedium;
  static const heading3 = AppTheme.headingSmall;
  static const body = AppTheme.bodyMedium;
  static const bodyLarge = AppTheme.bodyLarge;
  static const bodySmall = AppTheme.bodySmall;
  static const caption = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: AppTheme.textHint,
    height: 1.4,
  );
}

// Shared decorations
class Decorations {
  static BoxDecoration card = BoxDecoration(
    color: AppTheme.cardBackground,
    borderRadius: BorderRadius.circular(AppTheme.radiusM),
    boxShadow: AppTheme.shadowSmall,
  );
  
  static BoxDecoration roundedBox = BoxDecoration(
    color: AppTheme.surfaceColor,
    borderRadius: BorderRadius.circular(AppTheme.radiusS),
  );
  
  static BoxDecoration moduleCard(Color color) {
    return BoxDecoration(
      color: color.withOpacity(0.1),
      borderRadius: BorderRadius.circular(AppTheme.radiusM),
      border: Border.all(color: color.withOpacity(0.3), width: 1),
    );
  }
}

// Shared paddings
class Paddings {
  static const EdgeInsets page = EdgeInsets.all(AppTheme.spacingL);
  static const EdgeInsets card = EdgeInsets.all(AppTheme.spacingM);
  static const EdgeInsets listItem = EdgeInsets.symmetric(
    vertical: AppTheme.spacingS,
    horizontal: AppTheme.spacingM,
  );
  static const EdgeInsets form = EdgeInsets.symmetric(
    vertical: AppTheme.spacingL,
  );
  static const EdgeInsets formField = EdgeInsets.symmetric(
    vertical: AppTheme.spacingS,
  );
}