// notetaker_frontend/lib/config/routes.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../config/constants.dart';
import '../notifiers/auth_notifier.dart';
import '../notifiers/module_notifier.dart';
import '../notifiers/note_notifier.dart';

import '../ui/auth/login_screen.dart';
import '../ui/auth/register_screen.dart';
import '../ui/dashboard/dashboard_screen.dart';
import '../ui/modules/create_module_screen.dart';
import '../ui/modules/module_screen.dart';
import '../ui/notes/edit_note_screen.dart';
import '../ui/notes/note_screen.dart';
import '../ui/settings/settings_screen.dart';
import '../ui/settings/account_screen.dart';
import '../ui/settings/theme_screen.dart';

GoRouter createRouter(
  AuthNotifier authNotifier,
  ModuleNotifier moduleNotifier,
  NoteNotifier noteNotifier,
) {
  return GoRouter(
    initialLocation: AppRoutes.login,
    redirect: (context, state) {
      final bool isLoggedIn = authNotifier.isAuthenticated.value;
      final bool isAuthRoute = state.location == AppRoutes.login || 
                               state.location == AppRoutes.register || 
                               state.location == AppRoutes.forgotPassword;
      
      // If not logged in and not on auth route, redirect to login
      if (!isLoggedIn && !isAuthRoute) {
        return AppRoutes.login;
      }
      
      // If logged in and on auth route, redirect to home
      if (isLoggedIn && isAuthRoute) {
        return AppRoutes.home;
      }
      
      // No redirection needed
      return null;
    },
    refreshListenable: authNotifier.isAuthenticated,
    routes: [
      // Auth routes
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (context, state) => const RegisterScreen(),
      ),
      
      // Main routes
      GoRoute(
        path: AppRoutes.home,
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: AppRoutes.settings,
        builder: (context, state) => const SettingsScreen(),
        routes: [
          GoRoute(
            path: 'account',
            builder: (context, state) => const AccountScreen(),
          ),
          GoRoute(
            path: 'theme',
            builder: (context, state) => const ThemeScreen(),
          ),
        ],
      ),
      
      // Module routes
      GoRoute(
        path: AppRoutes.modules,
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: AppRoutes.createModule,
        builder: (context, state) => const CreateModuleScreen(),
      ),
      GoRoute(
        path: AppRoutes.moduleDetails,
        builder: (context, state) {
          final moduleId = state.pathParameters['moduleId'] ?? '';
          return ModuleScreen(moduleId: moduleId);
        },
      ),
      
      // Note routes
      GoRoute(
        path: AppRoutes.createNote,
        builder: (context, state) {
          final moduleId = state.pathParameters['moduleId'] ?? '';
          return EditNoteScreen(moduleId: moduleId);
        },
      ),
      GoRoute(
        path: AppRoutes.noteDetails,
        builder: (context, state) {
          final moduleId = state.pathParameters['moduleId'] ?? '';
          final noteId = state.pathParameters['noteId'] ?? '';
          return NoteScreen(moduleId: moduleId, noteId: noteId);
        },
      ),
      GoRoute(
        path: AppRoutes.editNote,
        builder: (context, state) {
          final moduleId = state.pathParameters['moduleId'] ?? '';
          final noteId = state.pathParameters['noteId'] ?? '';
          return EditNoteScreen(moduleId: moduleId, noteId: noteId);
        },
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Error: ${state.error}'),
      ),
    ),
  );
}