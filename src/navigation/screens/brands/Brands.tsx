import React, { useCallback } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BrandsStackParamList } from '@/types';
import { BrandsScreen } from './BrandsScreen';
import { BrandDetails } from './BrandDetails';
import { PostDetails } from '../discover/PostDetails';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { theme } from '@/context/ThemeContext';
import { CustomText } from '@/components/CustomText';
import { UserProfile } from '../discover/UserProfile';
import { Layout } from '@/components/Layout';

const Stack = createNativeStackNavigator<BrandsStackParamList>();

const BackButton = React.memo(({ navigation, title }: { navigation: any; title: string }) => (
    <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ flexDirection: 'row', alignItems: 'center' }}
    >
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        <CustomText style={{ marginLeft: 8, fontSize: 16 }}>{title}</CustomText>
    </TouchableOpacity>
));

export const Brands = React.memo(() => {
    const screenOptions = useCallback(({ navigation }) => ({
        headerShown: true,
        headerTitle: '',
        headerStyle: {
            backgroundColor: theme.colors.background
        },
        headerLeft: () => (
            <BackButton navigation={navigation} title="Brands" />
        ),
    }), []);

    return (
        <Layout>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="BrandsScreen" component={BrandsScreen} />
                <Stack.Screen
                    name="UserProfile"
                    component={UserProfile}
                    options={screenOptions}
                />
                <Stack.Screen
                    name="BrandDetails"
                    component={BrandDetails}
                    options={screenOptions}
                />
                <Stack.Screen name="PostDetails" component={PostDetails} />
            </Stack.Navigator>
        </Layout>
    );
});