// notetaker_frontend/lib/app.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_core/firebase_core.dart';

import 'config/constants.dart';
import 'notifiers/auth_notifier.dart';
import 'notifiers/module_notifier.dart';
import 'notifiers/note_notifier.dart';
import 'notifiers/theme_notifier.dart';
import 'services/auth_service.dart';
import 'services/firestore_service.dart';
import 'services/storage_service.dart';
import 'services/tier_service.dart';

import 'ui/auth/login_screen.dart';
import 'ui/auth/register_screen.dart';
import 'ui/dashboard/dashboard_screen.dart';
import 'ui/modules/create_module_screen.dart';
import 'ui/modules/module_screen.dart';
import 'ui/notes/edit_note_screen.dart';
import 'ui/notes/note_screen.dart';
import 'ui/settings/settings_screen.dart';
import 'ui/settings/account_screen.dart';
import 'ui/settings/theme_screen.dart';

class NoteTakerApp extends StatefulWidget {
  const NoteTakerApp({Key? key}) : super(key: key);

  @override
  State<NoteTakerApp> createState() => _NoteTakerAppState();
}

class _NoteTakerAppState extends State<NoteTakerApp> {
  late final AuthService _authService;
  late final FirestoreService _firestoreService;
  late final StorageService _storageService;
  late final TierService _tierService;
  
  late final AuthNotifier _authNotifier;
  late final ModuleNotifier _moduleNotifier;
  late final NoteNotifier _noteNotifier;
  late final ThemeNotifier _themeNotifier;
  
  late final GoRouter _router;
  
  @override
  void initState() {
    super.initState();
    
    // Initialize services
    _authService = AuthService();
    _firestoreService = FirestoreService();
    _storageService = StorageService();
    _tierService = TierService();
    
    // Initialize notifiers
    _authNotifier = AuthNotifier(_authService);
    _moduleNotifier = ModuleNotifier(_firestoreService);
    _noteNotifier = NoteNotifier(_firestoreService, _storageService);
    _themeNotifier = ThemeNotifier();
    
    // Initialize router
    _router = _createRouter();
  }
  
  GoRouter _createRouter() {
    return GoRouter(
      initialLocation: AppRoutes.login,
      redirect: (context, state) {
        final bool isLoggedIn = _authNotifier.isAuthenticated.value;
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
      refreshListenable: _authNotifier.isAuthenticated,
      routes: [
        // Auth routes
        GoRoute(
          path: AppRoutes.login,
          builder: (context, state) => LoginScreen(
            authNotifier: _authNotifier,
          ),
        ),
        GoRoute(
          path: AppRoutes.register,
          builder: (context, state) => RegisterScreen(
            authNotifier: _authNotifier,
          ),
        ),
        
        // Main routes
        GoRoute(
          path: AppRoutes.home,
          builder: (context, state) => DashboardScreen(
            authNotifier: _authNotifier,
            moduleNotifier: _moduleNotifier,
            noteNotifier: _noteNotifier,
          ),
        ),
        GoRoute(
          path: AppRoutes.settings,
          builder: (context, state) => SettingsScreen(
            authNotifier: _authNotifier,
            themeNotifier: _themeNotifier,
          ),
          routes: [
            GoRoute(
              path: 'account',
              builder: (context, state) => AccountScreen(
                authNotifier: _authNotifier,
                tierService: _tierService,
              ),
            ),
            GoRoute(
              path: 'theme',
              builder: (context, state) => ThemeScreen(
                themeNotifier: _themeNotifier,
              ),
            ),
          ],
        ),
        
        // Module routes
        GoRoute(
          path: AppRoutes.modules,
          builder: (context, state) => DashboardScreen(
            authNotifier: _authNotifier,
            moduleNotifier: _moduleNotifier,
            noteNotifier: _noteNotifier,
          ),
        ),
        GoRoute(
          path: AppRoutes.createModule,
          builder: (context, state) => CreateModuleScreen(
            authNotifier: _authNotifier,
            moduleNotifier: _moduleNotifier,
          ),
        ),
        GoRoute(
          path: AppRoutes.moduleDetails,
          builder: (context, state) {
            final moduleId = state.pathParameters['moduleId'] ?? '';
            return ModuleScreen(
              moduleId: moduleId,
              moduleNotifier: _moduleNotifier,
              noteNotifier: _noteNotifier,
            );
          },
        ),
        
        // Note routes
        GoRoute(
          path: AppRoutes.createNote,
          builder: (context, state) {
            final moduleId = state.pathParameters['moduleId'] ?? '';
            return EditNoteScreen(
              moduleId: moduleId,
              authNotifier: _authNotifier,
              moduleNotifier: _moduleNotifier,
              noteNotifier: _noteNotifier,
            );
          },
        ),
        GoRoute(
          path: AppRoutes.noteDetails,
          builder: (context, state) {
            final moduleId = state.pathParameters['moduleId'] ?? '';
            final noteId = state.pathParameters['noteId'] ?? '';
            return NoteScreen(
              moduleId: moduleId,
              noteId: noteId,
              moduleNotifier: _moduleNotifier,
              noteNotifier: _noteNotifier,
            );
          },
        ),
        GoRoute(
          path: AppRoutes.editNote,
          builder: (context, state) {
            final moduleId = state.pathParameters['moduleId'] ?? '';
            final noteId = state.pathParameters['noteId'] ?? '';
            return EditNoteScreen(
              moduleId: moduleId,
              noteId: noteId,
              authNotifier: _authNotifier,
              moduleNotifier: _moduleNotifier,
              noteNotifier: _noteNotifier,
            );
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
  
  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: _themeNotifier.themeMode,
      builder: (context, themeMode, _) {
        return MaterialApp.router(
          title: AppStrings.appName,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.lightTheme, // We can add dark theme later
          themeMode: themeMode,
          routerConfig: _router,
          debugShowCheckedModeBanner: false,
        );
      },
    );
  }
}