// notetaker_frontend/lib/ui/auth/login_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/constants.dart';
import '../../notifiers/auth_notifier.dart';
import '../../services/auth_service.dart';
import '../shared/styles.dart';
import '../shared/widgets/app_button.dart';
import '../shared/widgets/app_text_field.dart';
import '../shared/widgets/loading_indicator.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

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
    super.dispose();
  }

  Future<void> _login() async {
    if (_formKey.currentState?.validate() ?? false) {
      final success = await _authNotifier.signIn(
        _emailController.text.trim(),
        _passwordController.text,
      );

      if (success && mounted) {
        context.go(AppRoutes.home);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: Paddings.page,
          child: ValueListenableBuilder<bool>(
            valueListenable: _authNotifier.isLoading,
            builder: (context, isLoading, child) {
              return Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Icon(
                    Icons.note_alt_outlined,
                    size: 64,
                    color: AppTheme.primaryColor,
                  ),
                  const SizedBox(height: AppTheme.spacingM),
                  Text(
                    AppStrings.appName,
                    style: TextStyles.heading1.copyWith(
                      color: AppTheme.primaryColor,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppTheme.spacingXl),
                  Text(
                    AppStrings.signIn,
                    style: TextStyles.heading2,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppTheme.spacingL),
                  Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
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
                          hint: 'Enter your password',
                          controller: _passwordController,
                          obscureText: true,
                          textInputAction: TextInputAction.done,
                          onSubmitted: (_) => _login(),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your password';
                            }
                            return null;
                          },
                        ),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed:
                                () => context.push(AppRoutes.forgotPassword),
                            child: const Text(AppStrings.forgotPassword),
                          ),
                        ),
                        const SizedBox(height: AppTheme.spacingM),
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
                          label: AppStrings.signIn,
                          onPressed: isLoading ? null : _login,
                          isLoading: isLoading,
                          fullWidth: true,
                        ),
                        const SizedBox(height: AppTheme.spacingL),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text(
                              AppStrings.noAccount,
                              style: TextStyle(color: AppTheme.textSecondary),
                            ),
                            TextButton(
                              onPressed: () => context.push(AppRoutes.register),
                              child: const Text(AppStrings.createAccount),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
