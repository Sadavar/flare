import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SessionProvider } from '@/context/SessionContext';
import { Navigation } from './navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from '@/context/ThemeContext';


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

export function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
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
