import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Layout } from '@/components/Layout';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FriendsStackParamList } from '@/types';
import { FriendsFeed } from './FriendsFeed';
import { UserProfile } from '../UserProfile';
import { PostDetails } from '../PostDetails';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '@/context/ThemeContext';
import { CustomText } from '@/components/CustomText';

const Stack = createNativeStackNavigator<FriendsStackParamList>();

export function Friends() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="FriendsFeed" component={FriendsFeed} />
            <Stack.Screen
                name="UserProfile"
                component={UserProfile}
                options={({ navigation }) => ({
                    headerShown: true,
                    headerTitle: '',
                    headerStyle: {
                        backgroundColor: theme.colors.background
                    },
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
                            <CustomText style={{ marginLeft: 8, fontSize: 16 }}>Friends</CustomText>
                        </TouchableOpacity>
                    ),
                })}
            />
            <Stack.Screen name="PostDetails" component={PostDetails} />
        </Stack.Navigator>
    );
}