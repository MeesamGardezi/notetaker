#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Creating Flutter Notes App Directory Structure...${NC}"

cd frontend

# Models
mkdir -p lib/models
touch lib/models/module_model.dart
touch lib/models/note_model.dart
touch lib/models/tag_model.dart
touch lib/models/user_model.dart
touch lib/models/image_model.dart

# State Management
mkdir -p lib/state
touch lib/state/app_state.dart
touch lib/state/auth_state.dart
touch lib/state/modules_state.dart
touch lib/state/notes_state.dart
touch lib/state/tags_state.dart
touch lib/state/editor_state.dart

# Services
mkdir -p lib/services
touch lib/services/api_service.dart
touch lib/services/auth_service.dart
touch lib/services/storage_service.dart
touch lib/services/image_service.dart

# Utils
mkdir -p lib/utils
touch lib/utils/constants.dart
touch lib/utils/theme.dart
touch lib/utils/validators.dart
touch lib/utils/formatters.dart

# Widgets
mkdir -p lib/widgets
touch lib/widgets/app_drawer.dart
touch lib/widgets/module_tile.dart
touch lib/widgets/note_tile.dart
touch lib/widgets/tag_chip.dart
touch lib/widgets/custom_app_bar.dart

# Custom Text Editor Widgets
mkdir -p lib/widgets/editor
touch lib/widgets/editor/editor.dart
touch lib/widgets/editor/text_block.dart
touch lib/widgets/editor/image_block.dart
touch lib/widgets/editor/list_block.dart
touch lib/widgets/editor/heading_block.dart
touch lib/widgets/editor/toolbar.dart
touch lib/widgets/editor/block_menu.dart
touch lib/widgets/editor/drag_handle.dart

# Screens
mkdir -p lib/screens
touch lib/screens/splash_screen.dart
touch lib/screens/login_screen.dart
touch lib/screens/register_screen.dart
touch lib/screens/home_screen.dart
touch lib/screens/note_screen.dart
touch lib/screens/settings_screen.dart
touch lib/screens/profile_screen.dart
touch lib/screens/module_screen.dart
touch lib/screens/tag_screen.dart

# Create main.dart (empty)
touch lib/main.dart

# Create pubspec.yaml (empty)
touch pubspec.yaml

# Create assets directories
mkdir -p assets/images
mkdir -p assets/icons

echo -e "${GREEN}Directory structure created with empty files.${NC}"