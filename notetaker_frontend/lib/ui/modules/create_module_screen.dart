// notetaker_frontend/lib/ui/modules/create_module_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/constants.dart';
import '../../models/user.dart';
import '../../notifiers/auth_notifier.dart';
import '../../notifiers/module_notifier.dart';
import '../shared/styles.dart';
import '../shared/widgets/app_button.dart';
import '../shared/widgets/app_text_field.dart';

class CreateModuleScreen extends StatefulWidget {
  final AuthNotifier authNotifier;
  final ModuleNotifier moduleNotifier;
  
  const CreateModuleScreen({
    Key? key,
    required this.authNotifier,
    required this.moduleNotifier,
  }) : super(key: key);

  @override
  State<CreateModuleScreen> createState() => _CreateModuleScreenState();
}

class _CreateModuleScreenState extends State<CreateModuleScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  
  Color _selectedColor = AppTheme.moduleColors[0];
  
  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }
  
  Future<void> _createModule() async {
    if (_formKey.currentState?.validate() ?? false) {
      final user = widget.authNotifier.currentUser.value;
      if (user == null) return;
      
      final module = await widget.moduleNotifier.createModule(
        _nameController.text.trim(),
        _descriptionController.text.trim(),
        user.id,
        _selectedColor,
      );
      
      if (module != null && mounted) {
        context.go('${AppRoutes.modules}/${module.id}');
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.newModule),
      ),
      body: ValueListenableBuilder<User?>(
        valueListenable: widget.authNotifier.currentUser,
        builder: (context, user, _) {
          if (user == null) {
            return const Center(child: Text('Not logged in'));
          }
          
          // Check module limit
          final canCreateModule = user.moduleCount < user.moduleLimit;
          
          return SingleChildScrollView(
            padding: Paddings.page,
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (!canCreateModule) ...[
                    Container(
                      padding: Paddings.card,
                      decoration: BoxDecoration(
                        color: AppTheme.warning.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(AppTheme.radiusM),
                        border: Border.all(color: AppTheme.warning),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Module Limit Reached',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: AppTheme.warning,
                            ),
                          ),
                          const SizedBox(height: AppTheme.spacingS),
                          Text(
                            'You have reached the maximum of ${user.moduleLimit} modules for your account tier. Upgrade to create more modules.',
                            style: TextStyles.body,
                          ),
                          const SizedBox(height: AppTheme.spacingM),
                          AppButton(
                            label: 'Upgrade Account',
                            onPressed: () => context.push('${AppRoutes.settings}/account'),
                            type: AppButtonType.secondary,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingL),
                  ],
                  AppTextField(
                    label: AppStrings.moduleName,
                    hint: 'Enter module name',
                    controller: _nameController,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter a module name';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: AppTheme.spacingM),
                  AppTextField(
                    label: AppStrings.moduleDescription,
                    hint: 'Enter module description',
                    controller: _descriptionController,
                    maxLines: 3,
                  ),
                  const SizedBox(height: AppTheme.spacingM),
                  const Text(
                    AppStrings.moduleColor,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacingS),
                  _buildColorPicker(),
                  const SizedBox(height: AppTheme.spacingL),
                  ValueListenableBuilder<String?>(
                    valueListenable: widget.moduleNotifier.error,
                    builder: (context, error, _) {
                      if (error != null && error.isNotEmpty) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: AppTheme.spacingM),
                          child: Text(
                            error,
                            style: const TextStyle(
                              color: AppTheme.error,
                              fontSize: 14,
                            ),
                          ),
                        );
                      }
                      return const SizedBox.shrink();
                    },
                  ),
                  ValueListenableBuilder<bool>(
                    valueListenable: widget.moduleNotifier.isLoading,
                    builder: (context, isLoading, _) {
                      return AppButton(
                        label: AppStrings.create,
                        onPressed: canCreateModule ? _createModule : null,
                        isLoading: isLoading,
                        fullWidth: true,
                      );
                    },
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
  
  Widget _buildColorPicker() {
    return Wrap(
      spacing: AppTheme.spacingM,
      runSpacing: AppTheme.spacingM,
      children: AppTheme.moduleColors.map((color) {
        final isSelected = _selectedColor == color;
        return GestureDetector(
          onTap: () {
            setState(() {
              _selectedColor = color;
            });
          },
          child: Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(AppTheme.radiusS),
              border: Border.all(
                color: isSelected ? Colors.white : color,
                width: 2,
              ),
              boxShadow: isSelected ? AppTheme.shadowMedium : null,
            ),
            child: isSelected
                ? const Center(
                    child: Icon(
                      Icons.check,
                      color: Colors.white,
                    ),
                  )
                : null,
          ),
        );
      }).toList(),
    );
  }
}