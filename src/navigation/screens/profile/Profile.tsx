import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';
import { ProfileMain } from './ProfileMain';
import { PostDetails } from './PostDetails';
import { UserProfile } from './UserProfile';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function Profile() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfileMain" component={ProfileMain} />
            <Stack.Screen name="PostDetails" component={PostDetails} />
            <Stack.Screen name="UserProfile" component={UserProfile} />
        </Stack.Navigator>
    );
} 