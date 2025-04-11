import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Colors for light theme
const Color _lightPrimaryColor = Color(0xFF6750A4);
const Color _lightPrimaryContainerColor = Color(0xFFEADDFF);
const Color _lightSecondaryColor = Color(0xFF625B71);
const Color _lightBackgroundColor = Color(0xFFF6F5F7);
const Color _lightSurfaceColor = Color(0xFFFFFFFF);
const Color _lightErrorColor = Color(0xFFB3261E);

// Colors for dark theme
const Color _darkPrimaryColor = Color(0xFFD0BCFF);
const Color _darkPrimaryContainerColor = Color(0xFF4F378B);
const Color _darkSecondaryColor = Color(0xFFCCC2DC);
const Color _darkBackgroundColor = Color(0xFF1C1B1F);
const Color _darkSurfaceColor = Color(0xFF2E2C32);
const Color _darkErrorColor = Color(0xFFF2B8B5);

// Text colors
const Color _lightTextPrimaryColor = Color(0xFF1C1B1F);
const Color _lightTextSecondaryColor = Color(0xFF49454F);
const Color _darkTextPrimaryColor = Color(0xFFE6E1E5);
const Color _darkTextSecondaryColor = Color(0xFFCAC4D0);

// Custom brand colors
const Color brandColor = Color(0xFF6750A4);
const Color accentColor = Color(0xFF8C38FF);

// Light Theme
final ThemeData lightTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  colorScheme: ColorScheme(
    brightness: Brightness.light,
    primary: _lightPrimaryColor,
    onPrimary: Colors.white,
    primaryContainer: _lightPrimaryContainerColor,
    onPrimaryContainer: Color(0xFF21005E),
    secondary: _lightSecondaryColor,
    onSecondary: Colors.white,
    secondaryContainer: Color(0xFFE8DEF8),
    onSecondaryContainer: Color(0xFF1E192B),
    tertiary: Color(0xFF7D5260),
    onTertiary: Colors.white,
    tertiaryContainer: Color(0xFFFFD8E4),
    onTertiaryContainer: Color(0xFF31111D),
    error: _lightErrorColor,
    onError: Colors.white,
    errorContainer: Color(0xFFF9DEDC),
    onErrorContainer: Color(0xFF410E0B),
    background: _lightBackgroundColor,
    onBackground: _lightTextPrimaryColor,
    surface: _lightSurfaceColor,
    onSurface: _lightTextPrimaryColor,
    surfaceVariant: Color(0xFFE7E0EC),
    onSurfaceVariant: Color(0xFF49454F),
    outline: Color(0xFF79747E),
    outlineVariant: Color(0xFFCAC4D0),
    shadow: Colors.black.withOpacity(0.15),
    scrim: Colors.black.withOpacity(0.3),
    inverseSurface: Color(0xFF313033),
    onInverseSurface: Color(0xFFF4EFF4),
    inversePrimary: Color(0xFFD0BCFF),
    surfaceTint: _lightPrimaryColor,
  ),
  
  // Text Theme using Google Fonts
  textTheme: TextTheme(
    displayLarge: GoogleFonts.inter(
      fontSize: 57,
      fontWeight: FontWeight.w400,
      letterSpacing: -0.25,
      color: _lightTextPrimaryColor,
    ),
    displayMedium: GoogleFonts.inter(
      fontSize: 45,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      color: _lightTextPrimaryColor,
    ),
    displaySmall: GoogleFonts.inter(
      fontSize: 36,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      color: _lightTextPrimaryColor,
    ),
    headlineLarge: GoogleFonts.inter(
      fontSize: 32,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: _lightTextPrimaryColor,
    ),
    headlineMedium: GoogleFonts.inter(
      fontSize: 28,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: _lightTextPrimaryColor,
    ),
    headlineSmall: GoogleFonts.inter(
      fontSize: 24,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: _lightTextPrimaryColor,
    ),
    titleLarge: GoogleFonts.inter(
      fontSize: 22,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: _lightTextPrimaryColor,
    ),
    titleMedium: GoogleFonts.inter(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.15,
      color: _lightTextPrimaryColor,
    ),
    titleSmall: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.1,
      color: _lightTextPrimaryColor,
    ),
    bodyLarge: GoogleFonts.inter(
      fontSize: 16,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.15,
      color: _lightTextPrimaryColor,
    ),
    bodyMedium: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.25,
      color: _lightTextPrimaryColor,
    ),
    bodySmall: GoogleFonts.inter(
      fontSize: 12,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.4,
      color: _lightTextSecondaryColor,
    ),
    labelLarge: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.1,
      color: _lightTextPrimaryColor,
    ),
    labelMedium: GoogleFonts.inter(
      fontSize: 12,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.5,
      color: _lightTextPrimaryColor,
    ),
    labelSmall: GoogleFonts.inter(
      fontSize: 11,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.5,
      color: _lightTextSecondaryColor,
    ),
  ),
  
  // Component themes
  appBarTheme: AppBarTheme(
    backgroundColor: _lightSurfaceColor,
    foregroundColor: _lightTextPrimaryColor,
    elevation: 0,
  ),
  cardTheme: CardTheme(
    color: _lightSurfaceColor,
    elevation: 1,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      foregroundColor: Colors.white,
      backgroundColor: _lightPrimaryColor,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
    ),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: _lightPrimaryColor,
      side: BorderSide(color: _lightPrimaryColor),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
    ),
  ),
  textButtonTheme: TextButtonThemeData(
    style: TextButton.styleFrom(
      foregroundColor: _lightPrimaryColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: _lightSurfaceColor,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: BorderSide(color: Color(0xFFCAC4D0)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: BorderSide(color: Color(0xFFCAC4D0)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: BorderSide(color: _lightPrimaryColor, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: BorderSide(color: _lightErrorColor),
    ),
    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
  ),
  chipTheme: ChipThemeData(
    backgroundColor: Color(0xFFE8DEF8),
    labelStyle: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      color: _lightPrimaryColor,
    ),
    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
    ),
  ),
  
  // Misc
  scaffoldBackgroundColor: _lightBackgroundColor,
  dividerColor: Color(0xFFE5E0EB),
  highlightColor: _lightPrimaryContainerColor.withOpacity(0.5),
  splashColor: _lightPrimaryContainerColor.withOpacity(0.3),
);

// Dark Theme
final ThemeData darkTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  colorScheme: ColorScheme(
    brightness: Brightness.dark,
    primary: _darkPrimaryColor,
    onPrimary: Color(0xFF381E72),
    primaryContainer: _darkPrimaryContainerColor,
    onPrimaryContainer: Color(0xFFEADDFF),
    secondary: _darkSecondaryColor,
    onSecondary: Color(0xFF332D41),
    secondaryContainer: Color(0xFF4A4458),
    onSecondaryContainer: Color(0xFFE8DEF8),
    tertiary: Color(0xFFEFB8C8),
    onTertiary: Color(0xFF492532),
    tertiaryContainer: Color(0xFF633B48),
    onTertiaryContainer: Color(0xFFFFD8E4),
    error: _darkErrorColor,
    onError: Color(0xFF601410),
    errorContainer: Color(0xFF8C1D18),
    onErrorContainer: Color(0xFFF9DEDC),
    background: _darkBackgroundColor,
    onBackground: _darkTextPrimaryColor,
    surface: _darkSurfaceColor,
    onSurface: _darkTextPrimaryColor,
    surfaceVariant: Color(0xFF49454F),
    onSurfaceVariant: Color(0xFFCAC4D0),
    outline: Color(0xFF938F99),
    outlineVariant: Color(0xFF49454F),
    shadow: Colors.black.withOpacity(0.3),
    scrim: Colors.black.withOpacity(0.5),
    inverseSurface: Color(0xFFE6E1E5),
    onInverseSurface: Color(0xFF313033),
    inversePrimary: Color(0xFF6750A4),
    surfaceTint: _darkPrimaryColor,
  ),
  
  // Text Theme using Google Fonts
  textTheme: TextTheme(
    displayLarge: GoogleFonts.inter(
      fontSize: 57,
      fontWeight: FontWeight.w400,
      letterSpacing: -0.25,
      color: _darkTextPrimaryColor,
    ),
    displayMedium: GoogleFonts.inter(
      fontSize: 45,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      color: _darkTextPrimaryColor,
    ),
    displaySmall: GoogleFonts.inter(
      fontSize: 36,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      color: _darkTextPrimaryColor,
    ),
    headlineLarge: GoogleFonts.inter(
      fontSize: 32,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: _darkTextPrimaryColor,
    ),
    headlineMedium: GoogleFonts.inter(
      fontSize: 28,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: _darkTextPrimaryColor,
    ),
    headlineSmall: GoogleFonts.inter(
      fontSize: 24,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: _darkTextPrimaryColor,
    ),
    titleLarge: GoogleFonts.inter(
      fontSize: 22,
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
      color: _darkTextPrimaryColor,
    ),
    titleMedium: GoogleFonts.inter(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.15,
      color: _darkTextPrimaryColor,
    ),
    titleSmall: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.1,
      color: _darkTextPrimaryColor,
    ),
    bodyLarge: GoogleFonts.inter(
      fontSize: 16,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.15,
      color: _darkTextPrimaryColor,
    ),
    bodyMedium: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.25,
      color: _darkTextPrimaryColor,
    ),
    bodySmall: GoogleFonts.inter(
      fontSize: 12,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.4,
      color: _darkTextSecondaryColor,
    ),
    labelLarge: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.1,
      color: _darkTextPrimaryColor,
    ),
    labelMedium: GoogleFonts.inter(
      fontSize: 12,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.5,
      color: _darkTextPrimaryColor,
    ),
    labelSmall: GoogleFonts.inter(
      fontSize: 11,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.5,
      color: _darkTextSecondaryColor,
    ),
  ),
  
  // Component themes
  appBarTheme: AppBarTheme(
    backgroundColor: _darkSurfaceColor,
    foregroundColor: _darkTextPrimaryColor,
    elevation: 0,
  ),
  cardTheme: CardTheme(
    color: _darkSurfaceColor,
    elevation: 1,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      foregroundColor: Color(0xFF381E72),
      backgroundColor: _darkPrimaryColor,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
    ),
  ),
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: _darkPrimaryColor,
      side: BorderSide(color: _darkPrimaryColor),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
    ),
  ),
  textButtonTheme: TextButtonThemeData(
    style: TextButton.styleFrom(
      foregroundColor: _darkPrimaryColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: Color(0xFF2E2C32),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: BorderSide(color: Color(0xFF49454F)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: BorderSide(color: Color(0xFF49454F)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: BorderSide(color: _darkPrimaryColor, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: BorderSide(color: _darkErrorColor),
    ),
    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
  ),
  chipTheme: ChipThemeData(
    backgroundColor: Color(0xFF4A4458),
    labelStyle: GoogleFonts.inter(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      color: _darkPrimaryColor,
    ),
    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
    ),
  ),
  
  // Misc
  scaffoldBackgroundColor: _darkBackgroundColor,
  dividerColor: Color(0xFF49454F),
  highlightColor: _darkPrimaryContainerColor.withOpacity(0.5),
  splashColor: _darkPrimaryContainerColor.withOpacity(0.3),
);