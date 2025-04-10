// notetaker_frontend/lib/ui/shared/widgets/app_text_field.dart
import 'package:flutter/material.dart';
import '../../../config/constants.dart';

class AppTextField extends StatelessWidget {
  final String label;
  final String? hint;
  final TextEditingController controller;
  final bool obscureText;
  final TextInputType keyboardType;
  final String? Function(String?)? validator;
  final int? maxLines;
  final int? maxLength;
  final TextInputAction? textInputAction;
  final Function(String)? onSubmitted;
  final Function(String)? onChanged;
  final Widget? suffixIcon;
  final bool autofocus;
  final FocusNode? focusNode;
  
  const AppTextField({
    Key? key,
    required this.label,
    this.hint,
    required this.controller,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.validator,
    this.maxLines = 1,
    this.maxLength,
    this.textInputAction,
    this.onSubmitted,
    this.onChanged,
    this.suffixIcon,
    this.autofocus = false,
    this.focusNode,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: AppTheme.spacingXs),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          validator: validator,
          maxLines: maxLines,
          maxLength: maxLength,
          textInputAction: textInputAction,
          onFieldSubmitted: onSubmitted,
          onChanged: onChanged,
          autofocus: autofocus,
          focusNode: focusNode,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: AppTheme.surfaceColor,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingM,
              vertical: AppTheme.spacingM,
            ),
            suffixIcon: suffixIcon,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusS),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusS),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusS),
              borderSide: const BorderSide(color: AppTheme.primaryColor, width: 1),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusS),
              borderSide: const BorderSide(color: AppTheme.error, width: 1),
            ),
          ),
        ),
      ],
    );
  }
}