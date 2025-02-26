import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BrandsStackParamList } from '@/types';
import { BrandsScreen } from './BrandsScreen';
import { BrandDetails } from './BrandDetails';
import { PostDetails } from '../PostDetails';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { theme } from '@/context/ThemeContext';
import { CustomText } from '@/components/CustomText';

const Stack = createNativeStackNavigator<BrandsStackParamList>();

export function Brands() {
    return (
        <ErrorBoundary>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="BrandsScreen" component={BrandsScreen} />
                <Stack.Screen
                    name="BrandDetails"
                    component={BrandDetails}
                    options={({ navigation }) => ({
                        headerShown: true,
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
                                <CustomText style={{ marginLeft: 8, fontSize: 16 }}>Brands</CustomText>
                            </TouchableOpacity>
                        ),
                    })}
                />
                <Stack.Screen name="PostDetails" component={PostDetails} />
            </Stack.Navigator>
        </ErrorBoundary>
    );
}