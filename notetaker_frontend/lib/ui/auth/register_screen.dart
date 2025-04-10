// notetaker_frontend/lib/ui/auth/register_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/constants.dart';
import '../../notifiers/auth_notifier.dart';
import '../../services/auth_service.dart';
import '../shared/styles.dart';
import '../shared/widgets/app_button.dart';
import '../shared/widgets/app_text_field.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({Key? key}) : super(key: key);

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _displayNameController = TextEditingController();

  late final AuthNotifier _authNotifier;

  @override
  void initState() {
    super.initState();
    final authService = AuthService();
    _authNotifier = AuthNotifier(authService);
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _displayNameController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (_formKey.currentState?.validate() ?? false) {
      final success = await _authNotifier.register(
        _emailController.text.trim(),
        _passwordController.text,
        _displayNameController.text.trim(),
      );

      if (success && mounted) {
        context.go(AppRoutes.home);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text(AppStrings.createAccount), elevation: 0),
      body: Center(
        child: SingleChildScrollView(
          padding: Paddings.page,
          child: ValueListenableBuilder<bool>(
            valueListenable: _authNotifier.isLoading,
            builder: (context, isLoading, child) {
              return Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    AppTextField(
                      label: AppStrings.displayName,
                      hint: 'Enter your name',
                      controller: _displayNameController,
                      textInputAction: TextInputAction.next,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your name';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: AppTheme.spacingM),
                    AppTextField(
                      label: AppStrings.email,
                      hint: 'Enter your email',
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter your email';
                        }
                        if (!RegExp(
                          r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$',
                        ).hasMatch(value)) {
                          return 'Please enter a valid email';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: AppTheme.spacingM),
                    AppTextField(
                      label: AppStrings.password,
                      hint: 'Create a password',
                      controller: _passwordController,
                      obscureText: true,
                      textInputAction: TextInputAction.next,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter a password';
                        }
                        if (value.length < 8) {
                          return 'Password must be at least 8 characters';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: AppTheme.spacingM),
                    AppTextField(
                      label: AppStrings.confirmPassword,
                      hint: 'Confirm your password',
                      controller: _confirmPasswordController,
                      obscureText: true,
                      textInputAction: TextInputAction.done,
                      onSubmitted: (_) => _register(),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please confirm your password';
                        }
                        if (value != _passwordController.text) {
                          return 'Passwords do not match';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: AppTheme.spacingL),
                    ValueListenableBuilder<String?>(
                      valueListenable: _authNotifier.error,
                      builder: (context, error, _) {
                        if (error != null && error.isNotEmpty) {
                          return Padding(
                            padding: const EdgeInsets.only(
                              bottom: AppTheme.spacingM,
                            ),
                            child: Text(
                              error,
                              style: const TextStyle(
                                color: AppTheme.error,
                                fontSize: 14,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                    AppButton(
                      label: AppStrings.createAccount,
                      onPressed: isLoading ? null : _register,
                      isLoading: isLoading,
                      fullWidth: true,
                    ),
                    const SizedBox(height: AppTheme.spacingL),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          AppStrings.alreadyHaveAccount,
                          style: TextStyle(color: AppTheme.textSecondary),
                        ),
                        TextButton(
                          onPressed: () => context.go(AppRoutes.login),
                          child: const Text(AppStrings.signIn),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
