import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GlobalStackParamList } from '@/types';
import { GlobalFeed } from './GlobalFeed';
import { UserProfile } from '../UserProfile';
import { PostDetails } from '../PostDetails';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const Stack = createNativeStackNavigator<GlobalStackParamList>();

export function Global() {
    return (
        <ErrorBoundary>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="GlobalFeed" component={GlobalFeed} />
                <Stack.Screen name="UserProfile" component={UserProfile} />
                <Stack.Screen
                    name="PostDetails"
                    component={PostDetails}
                    options={({ navigation }) => ({
                        headerShown: true,
                        headerTitle: '',
                        headerLeft: () => (
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                            >
                                <MaterialIcons name="arrow-back" size={24} color="black" />
                                <Text style={{ marginLeft: 8, fontSize: 16 }}>Global</Text>
                            </TouchableOpacity>
                        ),
                    })}
                />
            </Stack.Navigator>
        </ErrorBoundary>
    );
}