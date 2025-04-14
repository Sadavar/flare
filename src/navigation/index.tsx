import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSession } from '@/context/SessionContext';
import React, { useState, useEffect, useCallback } from 'react';
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
import { ForYou } from './screens/global/foryou/ForYou';
import { Friends } from './screens/global/friends/Friends';
import { Discover } from './screens/discover/Discover';
import { Search } from './screens/search/Search';
import { Layout } from '@/components/Layout';
import { UserProfile } from './screens/global/UserProfile';
import { ProfileMain } from './screens/profile/ProfileMain';
import { PostDetails } from './screens/PostDetails';
import { BrandDetails } from './screens/BrandDetails';
import { PostEdit } from './screens/profile/PostEdit';
import { FollowList } from './screens/profile/FollowList';
import { AllPosts } from './screens/profile/AllPosts';
import { UserAllPosts } from './screens/global/UserAllPosts';
import Notis from './screens/notis/Notis';
import { BackButton } from '@/components/BackButton';

const Stack = createNativeStackNavigator<RootStackParamList>();
const BottomTab = createBottomTabNavigator<MainTabParamList>();
const TopTab = createMaterialTopTabNavigator<DiscoverTabParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function TopTabNavigator() {
  return (
    <Layout>
      <ErrorBoundary>
        <TopTab.Navigator
          initialRouteName="ForYou"
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
            name="ForYou"
            component={ForYou}
            options={{
              tabBarLabel: 'For You',
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

const customTabIcon = (source: any, color: string) => (
  <View style={{ paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
    <Image source={source} style={{ width: 25, height: 25, tintColor: color }} />
  </View>
);

// Bottom Tab Navigator
function MainTabs() {
  const postModalRef = useRef<Modalize>(null);

  return (
    <>
      <BottomTab.Navigator
        initialRouteName="Global"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          lazy: true,
          tabBarStyle: {
            // elevation: 8,
            // shadowColor: 'rgba(0, 0, 0, 1)',
            // shadowOffset: { width: 0, height: 4 },
            // shadowOpacity: 0.7,
            // shadowRadius: 12,
            backgroundColor: theme.colors.background,
            height: '90'
            // borderTopColor: theme.colors.background,
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.tabBarInactive,
        }}
      >
        <BottomTab.Screen
          name="Global"
          component={TopTabNavigator}
          options={{
            tabBarIcon: ({ color }) =>
              customTabIcon(require('@/assets/icons/Discover.png'), color)
          }}
        />
        <BottomTab.Screen
          name="Discover"
          component={Discover}
          options={{
            tabBarIcon: ({ color }) => (
              customTabIcon(require('@/assets/icons/Search.png'), color)
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
              // customTabIcon(require('@/assets/icons/Post.png'), color)
              <View style={{ paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
                <Image source={require('@/assets/icons/Post.png')} style={{ width: 33, height: 33, tintColor: color }} />
              </View>
              // <View
              //   style={{

              //     borderRadius: 25,
              //     backgroundColor: theme.colors.background,
              //     justifyContent: 'center',
              //     alignItems: 'center',
              //     marginBottom: 30, // lift it above the tab bar
              //     // shadowColor: '#000',
              //     // shadowOffset: { width: 0, height: 2 },
              //     // shadowOpacity: 0.3,
              //     // shadowRadius: 4,
              //     // elevation: 5,
              //   }}
              // >
              //   <Image
              //     source={require('@/assets/icons/Post.png')}
              //     style={{
              //       width: 38,
              //       height: 38,
              //       tintColor: color,
              //     }}
              //   />
              // </View>
            )

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
          name="Notis"
          component={Notis}
          options={{
            tabBarIcon: ({ color }) => (
              // customTabIcon(require('@/assets/icons/Notis.png'), color)
              <View style={{ paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
                <Image source={require('@/assets/icons/Notis.png')} style={{ width: 55, height: 55, tintColor: color }} />
              </View>
            ),
          }}
        />

        <BottomTab.Screen
          name="Profile"
          component={ProfileNavigator}
          options={{
            tabBarIcon: ({ color }) => (
              // <MaterialIcons style={{ paddingTop: 5, justifyContent: 'center', alignItems: 'center' }} name="person" size={30} color={color} />
              // customTabIcon(require('@/assets/icons/Friends2.png'), color)
              <View style={{ paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
                <Image source={require('@/assets/icons/Friends2.png')} style={{ width: 38, height: 38, tintColor: color }} />
              </View>
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
  const screenOptions = useCallback(({ navigation }) => ({
    headerShown: true,
    headerTitle: '',
    headerStyle: {
      backgroundColor: theme.colors.background
    },
    headerLeft: () => (
      <BackButton navigation={navigation} title="" />
    ),
  }), []);

  return (
    <Layout>
      <ProfileStack.Navigator
        screenOptions={{
          headerShown: false,
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
        // options={screenOptions}
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
        <Stack.Screen
          name="BrandDetails"
          component={BrandDetails}
          options={screenOptions}
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
