import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BrandsStackParamList } from '@/navigation/types';
import { BrandsScreen } from './BrandsScreen';
import { BrandDetails } from './BrandDetails';
import { PostDetails } from '../PostDetails';

const Stack = createNativeStackNavigator<BrandsStackParamList>();

export function Brands() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="BrandsScreen" component={BrandsScreen} />
            <Stack.Screen name="BrandDetails" component={BrandDetails} />
            <Stack.Screen name="PostDetails" component={PostDetails} />
        </Stack.Navigator>
    );
} 