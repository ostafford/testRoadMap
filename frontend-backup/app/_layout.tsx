/**
 * Root Application Layout
 * 
 * This component serves as the foundation for the entire ReMap React Native
 * application. It handles application initialization, theme configuration,
 * and navigation structure setup.
 * 
 * Key responsibilities:
 * - Font loading and asset management
 * - Theme and color scheme configuration
 * - Navigation structure initialization
 * - Error boundary handling for production reliability
 * - Splash screen management during app initialization
 */

import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

// Export error boundary for production error handling
export {
  ErrorBoundary,
} from 'expo-router';

// Configure initial route for the application
export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent splash screen from auto-hiding during initialization
SplashScreen.preventAutoHideAsync();

/**
 * Main Root Layout Component
 * 
 * This component orchestrates the application initialization process and
 * establishes the foundational structure that all other components build upon.
 * It demonstrates several important React Native application patterns.
 */
export default function RootLayout() {
  // Load custom fonts and icon fonts
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Handle font loading errors
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Hide splash screen once fonts are loaded
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Show nothing while fonts are loading
  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

/**
 * Navigation Layout Component
 * 
 * This component configures the navigation structure and theme handling
 * for the ReMap application. It demonstrates how to create flexible
 * navigation that adapts to user preferences and system settings.
 */
function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="modal" 
          options={{ 
            presentation: 'modal',
            title: 'Create Memory',
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#1F2937' : '#FFFFFF',
            },
            headerTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#1F2937',
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}