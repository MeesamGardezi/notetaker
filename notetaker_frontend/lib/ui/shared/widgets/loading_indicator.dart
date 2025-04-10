// notetaker_frontend/lib/ui/shared/widgets/loading_indicator.dart
import 'package:flutter/material.dart';
import '../../../config/constants.dart';

class LoadingIndicator extends StatelessWidget {
  final double size;
  final Color? color;
  final String? message;
  
  const LoadingIndicator({
    Key? key,
    this.size = 40.0,
    this.color,
    this.message,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(
                color ?? AppTheme.primaryColor,
              ),
              strokeWidth: 3,
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: AppTheme.spacingM),
            Text(
              message!,
              style: const TextStyle(
                fontSize: 14,
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ],
      ),
    );
  }
}