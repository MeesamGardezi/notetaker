#!/bin/bash

# Create Flutter project if it doesn't exist
if [ ! -d "lib" ]; then
  echo "Flutter project not found. Please create a Flutter project first."
  exit 1
fi

# Create main directory structure
mkdir -p lib/config
mkdir -p lib/models
mkdir -p lib/services
mkdir -p lib/notifiers
mkdir -p lib/ui/shared/widgets
mkdir -p lib/ui/auth
mkdir -p lib/ui/dashboard
mkdir -p lib/ui/modules
mkdir -p lib/ui/notes
mkdir -p lib/ui/settings

# Create config files
touch lib/config/constants.dart
touch lib/config/routes.dart

# Create model files
touch lib/models/user.dart
touch lib/models/module.dart
touch lib/models/note.dart
touch lib/models/media.dart

# Create service files
touch lib/services/auth_service.dart
touch lib/services/firestore_service.dart
touch lib/services/storage_service.dart
touch lib/services/tier_service.dart

# Create notifiers (using ValueListenable instead of Provider)
touch lib/notifiers/auth_notifier.dart
touch lib/notifiers/module_notifier.dart
touch lib/notifiers/note_notifier.dart
touch lib/notifiers/theme_notifier.dart

# Create shared UI files
touch lib/ui/shared/styles.dart
touch lib/ui/shared/widgets/app_button.dart
touch lib/ui/shared/widgets/app_text_field.dart
touch lib/ui/shared/widgets/loading_indicator.dart

# Create UI screen files for Auth
touch lib/ui/auth/login_screen.dart
touch lib/ui/auth/register_screen.dart

# Create UI screen files for Dashboard
touch lib/ui/dashboard/dashboard_screen.dart
touch lib/ui/dashboard/widgets/module_card.dart
touch lib/ui/dashboard/widgets/recent_notes.dart

# Create UI screen files for Modules
touch lib/ui/modules/module_screen.dart
touch lib/ui/modules/create_module_screen.dart
touch lib/ui/modules/widgets/note_card.dart

# Create UI screen files for Notes
touch lib/ui/notes/note_screen.dart
touch lib/ui/notes/edit_note_screen.dart
touch lib/ui/notes/widgets/media_item.dart

# Create UI screen files for Settings
touch lib/ui/settings/settings_screen.dart
touch lib/ui/settings/account_screen.dart
touch lib/ui/settings/theme_screen.dart

# Create main app files
touch lib/app.dart
touch lib/main.dart

echo "Project structure created successfully!"