import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/types';
import { ProfileMain } from './ProfileMain';
import { PostDetails } from './PostDetails';
import { PostEdit } from './PostEdit';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function Profile() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: true,
                headerTitle: 'Profile',
                headerStyle: {
                    backgroundColor: 'white',
                },
                headerTintColor: 'black',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen name="ProfileMain" component={ProfileMain} />
            <Stack.Screen name="PostDetails" component={PostDetails}
                options={{
                    headerTitle: '',
                }} />
            <Stack.Screen
                name="PostEdit"
                component={PostEdit}
                options={{
                    headerTitle: 'Edit Post',
                }}
            />
        </Stack.Navigator>
    );
} 