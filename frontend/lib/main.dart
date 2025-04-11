import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_web_plugins/url_strategy.dart';
import 'package:shared_preferences/shared_preferences.dart';

// State Management
import './state/auth_state.dart';
import './state/app_state.dart';

// Services
import './services/api_service.dart';
import './services/storage_service.dart';

// Routing
import './routes.dart';

// Theme
import './utils/theme.dart';

void main() async {
  // Ensure Flutter is initialized
  WidgetsFlutterBinding.ensureInitialized();
  
  // Use path URLs instead of hash URLs
  usePathUrlStrategy();
  
  // Initialize services
  final prefs = await SharedPreferences.getInstance();
  final storageService = StorageService(prefs: prefs);
  final apiService = ApiService(storageService: storageService);
  
  // Initialize state
  final authState = AuthState(
    apiService: apiService, 
    storageService: storageService
  );
  
  // Pre-load auth state
  await authState.initializeAuth();
  
  // Set preferred orientations
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  
  // Run the app
  runApp(NotesApp(
    authState: authState,
    storageService: storageService,
    apiService: apiService,
  ));
}

class NotesApp extends StatefulWidget {
  final AuthState authState;
  final StorageService storageService;
  final ApiService apiService;
  
  const NotesApp({
    Key? key, 
    required this.authState,
    required this.storageService,
    required this.apiService,
  }) : super(key: key);

  @override
  State<NotesApp> createState() => _NotesAppState();
}

class _NotesAppState extends State<NotesApp> {
  late final AppRouter appRouter;
  late final AppState appState;
  final ValueNotifier<ThemeMode> themeModeNotifier = ValueNotifier(ThemeMode.system);
  
  @override
  void initState() {
    super.initState();
    appRouter = AppRouter(authState: widget.authState);
    appState = AppState(
      authState: widget.authState,
      apiService: widget.apiService,
      storageService: widget.storageService,
    );
    
    // Initialize theme from saved preferences
    _loadThemePreference();
    
    // Listen for theme changes
    widget.storageService.themePreferenceChanges.listen((ThemeMode mode) {
      themeModeNotifier.value = mode;
    });
  }
  
  Future<void> _loadThemePreference() async {
    final themeMode = await widget.storageService.getThemeMode();
    themeModeNotifier.value = themeMode;
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: themeModeNotifier,
      builder: (context, themeMode, _) {
        return MaterialApp.router(
          title: 'Notes App',
          theme: lightTheme,
          darkTheme: darkTheme,
          themeMode: themeMode,
          debugShowCheckedModeBanner: false,
          routerConfig: appRouter.router,
          builder: (context, child) {
            return MediaQuery(
              data: MediaQuery.of(context).copyWith(
                textScaler: TextScaler.linear(
                  appState.textScaleFactor.value,
                ),
              ),
              child: child!,
            );
          },
        );
      },
    );
  }
  
  @override
  void dispose() {
    themeModeNotifier.dispose();
    super.dispose();
  }
}