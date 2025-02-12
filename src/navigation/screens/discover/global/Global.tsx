import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GlobalStackParamList } from '@/types';
import { GlobalFeed } from './GlobalFeed';
import { UserProfile } from '../UserProfile';
import { PostDetails } from '../PostDetails';

const Stack = createNativeStackNavigator<GlobalStackParamList>();

export function Global() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="GlobalFeed" component={GlobalFeed} />
            <Stack.Screen name="UserProfile" component={UserProfile} />
            <Stack.Screen name="PostDetails" component={PostDetails} />
        </Stack.Navigator>
    );
}