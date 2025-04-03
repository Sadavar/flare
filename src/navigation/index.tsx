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
import type { RootStackParamList, MainTabParamList, DiscoverTabParamList, ProfileStackParamList } from '../types';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { theme } from '@/context/ThemeContext';
import { Image } from 'expo-image';

// Import screens
import { Login } from './screens/auth/Login';
import { Username } from './screens/auth/Username';
import { Post } from './screens/post/Post';
import { Global } from './screens/discover/global/Global';
import { Friends } from './screens/discover/friends/Friends';
import { Brands } from './screens/brands/Brands';
import { Search } from './screens/search/Search';
import { Layout } from '@/components/Layout';
import { UserProfile } from './screens/discover/UserProfile';
import { ProfileMain } from './screens/profile/ProfileMain';
import { PostDetails } from './screens/profile/PostDetails';
import { PostEdit } from './screens/profile/PostEdit';
import { FollowList } from './screens/profile/FollowList';
import { AllPosts } from './screens/profile/AllPosts';
import { UserAllPosts } from './screens/discover/UserAllPosts';

const Stack = createNativeStackNavigator<RootStackParamList>();
const BottomTab = createBottomTabNavigator<MainTabParamList>();
const TopTab = createMaterialTopTabNavigator<DiscoverTabParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function TopTabNavigator() {
  return (
    <Layout>
      <ErrorBoundary>
        <TopTab.Navigator
          initialRouteName="Global"
          screenOptions={{
            tabBarIndicatorStyle: { backgroundColor: theme.colors.light_background_1 },
            tabBarPressColor: 'transparent',
            swipeEnabled: true,
            tabBarStyle: {
              elevation: 8,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.7,
              shadowRadius: 6,
              borderTopColor: theme.colors.background,
              backgroundColor: theme.colors.background,
              paddingBottom: 0,
              height: 50,
              alignSelf: "center",
              width: "50%",

              borderBottomColor: 'rgba(0, 0, 0, 0.05)',
              borderBottomWidth: 0.5,
            },
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.tabBarInactive,
          }}
        >
          <TopTab.Screen
            name="Global"
            component={Global}
            options={{
              tabBarLabel: 'Global',
              tabBarLabelStyle: {
                fontSize: 14,
                fontWeight: 'bold'
              }
            }}
          />
          <TopTab.Screen
            name="Friends"
            component={Friends}
            options={{
              tabBarLabel: 'Friends',
              tabBarLabelStyle: {
                fontSize: 14,
                fontWeight: 'bold'
              }
            }}
          />
        </TopTab.Navigator>
      </ErrorBoundary>
    </Layout>
  );
}

// Bottom Tab Navigator
function MainTabs() {
  const postModalRef = useRef<Modalize>(null);

  return (
    <>
      <BottomTab.Navigator
        initialRouteName="Discover"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            elevation: 8, // Increased elevation for Android shadow
            shadowColor: 'rgba(0, 0, 0, 1)', // Shadow color with transparency
            shadowOffset: { width: 0, height: 4 }, // Shadow positioned below the tab
            shadowOpacity: 0.7, // Moderate shadow visibility
            shadowRadius: 12, // Diffused shadow edge
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.background,
            height: "70"
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.tabBarInactive,
        }}
      >
        <BottomTab.Screen
          name="Discover"
          component={TopTabNavigator}
          options={{
            tabBarIcon: ({ color }) => (
              <Image
                source={require('@/assets/icons/Discover.png')}
                style={{ width: 30, height: 30, tintColor: color }}
              />
            ),
          }}
        />
        <BottomTab.Screen
          name="Post"
          component={Post}
          options={{
            headerShown: true,
            title: 'Create Post',
            headerStyle: {
              backgroundColor: theme.colors.background,
            },
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="add-box" size={30} color={color} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              // Prevent default navigation
              e.preventDefault();
              // Open modal
              postModalRef.current?.open();
            },
          }}
        />
        <BottomTab.Screen
          name="Brands"
          component={Brands}
          options={{
            tabBarIcon: ({ color }) => (
              <Image
                source={require('@/assets/icons/Brands.png')}
                style={{ width: 30, height: 30, tintColor: color }}
              />
            ),
          }}
        />

        <BottomTab.Screen
          name="Profile"
          component={ProfileNavigator}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="person" size={30} color={color} />
            ),
          }}
        />
      </BottomTab.Navigator>
      <Modalize
        ref={postModalRef}
        adjustToContentHeight
        modalStyle={{ backgroundColor: theme.colors.background }}
      >
        <PostModal modalRef={postModalRef} />
      </Modalize>
    </>
  );
}

function ProfileNavigator() {
  return (
    <Layout>
      <ProfileStack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        <ProfileStack.Screen
          name="ProfileMain"
          component={ProfileMain}
          options={{ title: 'Profile' }}

        />
        <ProfileStack.Screen
          name="PostDetails"
          component={PostDetails}
          options={{ title: 'Post Details' }}
        />
        <ProfileStack.Screen
          name="PostEdit"
          component={PostEdit}
          options={{ title: 'Edit Post' }}
        />
        <ProfileStack.Screen
          name="FollowList"
          component={FollowList}
          options={{ title: 'Friends' }}
        />
        <ProfileStack.Screen
          name="AllPosts"
          component={AllPosts}
          options={({ route }) => ({
            title: route.params?.type === 'saved' ? 'Saved Posts' : 'All Posts'
          })}
        />
      </ProfileStack.Navigator>
    </Layout>
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
