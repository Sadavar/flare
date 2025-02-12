import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSession } from '@/context/SessionContext';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRef } from 'react';
import { Modalize } from 'react-native-modalize';
import { PostModal } from '@/components/PostModal';
import type { RootStackParamList, MainTabParamList, DiscoverTabParamList } from '../types';

// Import screens
import { Login } from './screens/auth/Login';
import { Username } from './screens/auth/Username';
import { Post } from './screens/post/Post';
import { Profile } from './screens/profile/Profile';
import { Global } from './screens/discover/global/Global';
import { Friends } from './screens/discover/friends/Friends';
import { Brands } from './screens/discover/brands/Brands';
import { Layout } from '@/components/Layout';
import { UserProfile } from './screens/discover/UserProfile';

const Stack = createNativeStackNavigator<RootStackParamList>();
const BottomTab = createBottomTabNavigator<MainTabParamList>();
const TopTab = createMaterialTopTabNavigator<DiscoverTabParamList>();

// Top Tab Navigator for Discover section
function TopTabNavigator() {
  return (
    <Layout>
      <TopTab.Navigator
        initialRouteName="Global"
        screenOptions={{
          tabBarStyle: { elevation: 0, shadowOpacity: 0 },
          tabBarIndicatorStyle: { backgroundColor: '#000' },
          tabBarPressColor: 'transparent',
          tabBarActiveTintColor: '#000',
          tabBarInactiveTintColor: '#666',
          swipeEnabled: true,
          tabBarItemStyle: { paddingBottom: 0 }
        }}
      >
        <TopTab.Screen
          name="Global"
          component={Global}
          options={{
            tabBarLabel: '',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="public" size={30} color={color} />
            ),
          }}
        />
        <TopTab.Screen
          name="Friends"
          component={Friends}
          options={{
            tabBarLabel: '',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="group" size={30} color={color} />
            ),
          }}
        />
        <TopTab.Screen
          name="Brands"
          component={Brands}
          options={{
            tabBarLabel: '',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="sell" size={30} color={color} />
            ),
          }}
        />
      </TopTab.Navigator>
    </Layout>
  );
}

// Bottom Tab Navigator
function MainTabs() {
  const modalRef = useRef<Modalize>(null);

  return (
    <>
      <BottomTab.Navigator
        initialRouteName="Discover"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            elevation: 0,
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
            backgroundColor: 'white',
          },
        }}
      >
        <BottomTab.Screen
          name="Discover"
          component={TopTabNavigator}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="explore" size={30} color={color} />
            ),
          }}
        />
        <BottomTab.Screen
          name="Post"
          component={Post}
          options={{
            headerShown: true,
            title: 'Create Post',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="add-box" size={30} color={color} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              // Prevent default navigation
              e.preventDefault();
              // Open modal
              modalRef.current?.open();
            },
          }}
        />
        <BottomTab.Screen
          name="Profile"
          component={Profile}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="person" size={30} color={color} />
            ),
          }}
        />
      </BottomTab.Navigator>
      <Modalize
        ref={modalRef}
        adjustToContentHeight
        modalStyle={{ backgroundColor: 'white' }}
      >
        <PostModal modalRef={modalRef} />
      </Modalize>
    </>
  );
}

export function Navigation() {
  const { user, username, loading: sessionLoading } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionLoading) {
      setIsLoading(false);
    }
  }, [sessionLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* <Text>Loading...</Text> */}
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={Login} />
      ) : !username ? (
        <Stack.Screen name="Username" component={Username} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}

// Type declarations
declare global {
  namespace ReactNavigation {
    interface RootParamList {
      Login: undefined;
      Username: undefined;
      Main: undefined;
      Discover: undefined;
      Post: undefined;
      Profile: undefined;
      Global: undefined;
      Friends: undefined;
      Brands: undefined;
    }
  }
}
