// notetaker_frontend/lib/app.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_core/firebase_core.dart';

import 'config/constants.dart';
import 'config/routes.dart';
import 'notifiers/auth_notifier.dart';
import 'notifiers/module_notifier.dart';
import 'notifiers/note_notifier.dart';
import 'notifiers/theme_notifier.dart';
import 'services/auth_service.dart';
import 'services/firestore_service.dart';
import 'services/storage_service.dart';
import 'services/tier_service.dart';

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
    _router = createRouter(
      _authNotifier,
      _moduleNotifier, 
      _noteNotifier,
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