import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

// Screens
import './screens/splash_screen.dart';
import './screens/login_screen.dart';
import './screens/register_screen.dart';
import './screens/home_screen.dart';
import './screens/note_screen.dart';
import './screens/settings_screen.dart';
import './screens/profile_screen.dart';
import './screens/module_screen.dart';
import './screens/tag_screen.dart';

// State Management
import './state/auth_state.dart';

class AppRouter {
  final AuthState authState;
  final ValueNotifier<String?> redirectPathNotifier = ValueNotifier<String?>(null);

  AppRouter({required this.authState});

  late final router = GoRouter(
    refreshListenable: authState, // GoRouter will refresh when authState changes
    debugLogDiagnostics: true,
    initialLocation: '/',
    redirect: (BuildContext context, GoRouterState state) {
      // Check if the user is authenticated
      final bool isLoggedIn = authState.isLoggedIn;
      
      // Check if the destination is a splash, login, or register screen
      final bool isGoingToSplash = state.matchedLocation == '/';
      final bool isGoingToLogin = state.matchedLocation == '/login';
      final bool isGoingToRegister = state.matchedLocation == '/register';
      final bool isGoingToAuth = isGoingToLogin || isGoingToRegister || isGoingToSplash;

      // Save requested path for deep linking if user isn't logged in
      if (!isLoggedIn && !isGoingToAuth && state.matchedLocation != '/home') {
        redirectPathNotifier.value = state.matchedLocation;
        return '/login';
      }
      
      // If user is logged in and is going to auth screen, redirect to home
      // or to previously requested deep link if available
      if (isLoggedIn && isGoingToAuth) {
        final redirectPath = redirectPathNotifier.value;
        if (redirectPath != null) {
          redirectPathNotifier.value = null; // Clear the stored path
          return redirectPath;
        }
        return '/home';
      }
      
      // No redirect needed
      return null;
    },
    routes: [
      // Initial splash screen
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      
      // Authentication routes
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
        routes: [
          // Support for deep link redirect after login
          GoRoute(
            path: 'redirect',
            builder: (context, state) {
              final targetPath = state.uri.queryParameters['to'] ?? '/home';
              return LoginScreen(redirectPath: targetPath);
            },
          ),
        ],
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      
      // Main application routes - Requiring authentication
      ShellRoute(
        builder: (context, state, child) {
          // This could wrap child with a common layout like AppShell
          return child;
        },
        routes: [
          GoRoute(
            path: '/home',
            builder: (context, state) {
              final searchQuery = state.uri.queryParameters['q'];
              return HomeScreen(searchQuery: searchQuery);
            },
          ),
          GoRoute(
            path: '/settings',
            builder: (context, state) => const SettingsScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
          
          // Module routes
          GoRoute(
            path: '/modules/:moduleId',
            name: 'module',
            builder: (context, state) {
              final moduleId = state.pathParameters['moduleId'] ?? '';
              return ModuleScreen(moduleId: moduleId);
            },
            routes: [
              // Nested note routes within a module
              GoRoute(
                path: 'notes/:noteId',
                name: 'moduleNote',
                builder: (context, state) {
                  final moduleId = state.pathParameters['moduleId'] ?? '';
                  final noteId = state.pathParameters['noteId'] ?? '';
                  return NoteScreen(
                    noteId: noteId, 
                    moduleId: moduleId,
                  );
                },
              ),
            ],
          ),
          
          // Note routes (direct access)
          GoRoute(
            path: '/notes/:noteId',
            name: 'note',
            builder: (context, state) {
              final noteId = state.pathParameters['noteId'] ?? '';
              return NoteScreen(noteId: noteId);
            },
          ),
          
          // Tag routes
          GoRoute(
            path: '/tags/:tagId',
            name: 'tag',
            builder: (context, state) {
              final tagId = state.pathParameters['tagId'] ?? '';
              return TagScreen(tagId: tagId);
            },
          ),
          
          // Search route
          GoRoute(
            path: '/search',
            builder: (context, state) {
              final query = state.uri.queryParameters['q'] ?? '';
              return HomeScreen(searchQuery: query);
            },
          ),
        ],
      ),
    ],
    
    // Handle 404 - page not found
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(title: const Text('Page Not Found')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Error 404',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text('The page you\'re looking for doesn\'t exist.'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/home'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
  
  // Helper method to get URLs for sharing
  String getShareableUrl(String path) {
    // This would return the full URL including domain when deployed
    // For local development, it returns the path
    return path;
  }
  
  // Helper method to generate deep link URLs for sharing content
  String getNoteShareUrl(String noteId) {
    return getShareableUrl('/notes/$noteId');
  }
  
  String getModuleShareUrl(String moduleId) {
    return getShareableUrl('/modules/$moduleId');
  }
  
  String getTagShareUrl(String tagId) {
    return getShareableUrl('/tags/$tagId');
  }
}