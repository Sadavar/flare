import React, { useCallback } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GlobalStackParamList } from '@/types';
import { ForYouFeed } from './ForYouFeed';
import { UserProfile } from '../UserProfile';
import { PostDetails } from '../PostDetails';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BaseColorLayout } from '@/components/ColorLayout';
import { theme } from '@/context/ThemeContext';
import { CustomText } from '@/components/CustomText';
import { UserAllPosts } from '../UserAllPosts';

const Stack = createNativeStackNavigator<GlobalStackParamList>();

export const ForYou = React.memo(() => {
    return (
        <ErrorBoundary>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="ForYouFeed" component={ForYouFeed} />
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
                                <CustomText style={{ marginLeft: 8, fontSize: 16 }}>Global</CustomText>
                            </TouchableOpacity>
                        ),
                    })}
                />
                <Stack.Screen
                    name="UserAllPosts"
                    component={UserAllPosts}
                    options={({ navigation }) => ({
                        headerShown: true,
                        headerTitle: '',
                        headerStyle: {
                            backgroundColor: theme.colors.background
                        },
                        headerLeft: () => (
                            <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
                                <CustomText style={{ marginLeft: 8, fontSize: 16 }}>Profile</CustomText>
                            </TouchableOpacity>
                        ),
                    })}
                />
                <Stack.Screen
                    name="PostDetails"
                    component={PostDetails}
                    options={({ navigation }) => ({
                        headerShown: false,
                        headerTitle: '',
                        headerStyle: {
                            backgroundColor: theme.colors.background
                        },
                        headerLeft: () => (
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                            >
                                <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
                                <CustomText style={{ marginLeft: 8, fontSize: 16 }}>Global</CustomText>
                            </TouchableOpacity>
                        ),
                    })}
                />
            </Stack.Navigator>
        </ErrorBoundary>
    );
});