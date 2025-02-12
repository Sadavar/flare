import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Layout } from '@/components/Layout';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FriendsStackParamList } from '@/types';
import { FriendsFeed } from './FriendsFeed';
import { UserProfile } from '../UserProfile';
import { PostDetails } from '../PostDetails';

const Stack = createNativeStackNavigator<FriendsStackParamList>();

export function Friends() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="FriendsFeed" component={FriendsFeed} />
            <Stack.Screen name="UserProfile" component={UserProfile} />
            <Stack.Screen name="PostDetails" component={PostDetails} />
        </Stack.Navigator>
    );
}