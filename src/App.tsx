import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SessionProvider } from '@/context/SessionContext';
import { Navigation } from './navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import { useCallback, useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import Entypo from '@expo/vector-icons/Entypo';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FE3D14',
    background: '#131418',
    light_primary_1: '#FE6E4F',
    light_primary_2: '#FF9E8A',
    light_primary_3: '#FFCFC4',
    light_background_1: '#313135',
    light_background_2: '#7C7C7F',
    light_background_3: '#C4C4C5',
    text: '#FFFFFF',
    subtext: '#7C7C7F',
    border: '#313135',
    tabBar: '#313135',
    tabBarInactive: '#7C7C7F',
    searchBar: '#313135',
  },
};

const queryClient = new QueryClient();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Set the animation options
SplashScreen.setOptions({
  duration: 3000,
  fade: true,
});

export function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync(Entypo.font);

        // Add a slight delay to ensure everything is properly loaded
        // await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  // Add a second useEffect to handle splash screen hiding based on app readiness
  useEffect(() => {
    const hideScreen = async () => {
      if (appIsReady) {
        try {
          // Hide the splash screen once app is ready
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn("Error hiding splash screen:", e);
        }
      }
    };

    hideScreen();
  }, [appIsReady]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        // This is a backup approach in case the useEffect doesn't work
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn("Error hiding splash screen in layout:", e);
      }
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <SessionProvider>
              <NavigationContainer theme={MyTheme}>
                <Navigation />
              </NavigationContainer>
            </SessionProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});