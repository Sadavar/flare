import React, { useCallback } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BrandsStackParamList } from '@/types';
import { DiscoverScreen } from './DiscoverScreen';
import { BrandDetails } from '@/navigation/screens/BrandDetails';
import { PostDetails } from '@/navigation/screens/PostDetails';
import { theme } from '@/context/ThemeContext';
import { CustomText } from '@/components/CustomText';
import { UserProfile } from '../global/UserProfile';
import { Layout } from '@/components/Layout';
import { Search } from '../search/Search';
import { StylePosts } from '../styleposts/StylePosts';

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

export const Discover = React.memo(() => {
    const screenOptions = useCallback(({ navigation }) => ({
        headerShown: true,
        headerTitle: '',
        headerStyle: {
            backgroundColor: theme.colors.background
        },
        headerLeft: () => (
            <BackButton navigation={navigation} title="" />
        ),
    }), []);

    return (
        <Layout>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen
                    name="DiscoverScreen"
                    component={DiscoverScreen} />
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
                <Stack.Screen
                    name="PostDetails"
                    component={PostDetails}
                />
                <Stack.Screen
                    name="Search"
                    component={Search}
                />
                <Stack.Screen
                    name="StylePosts"
                    component={StylePosts}
                    options={screenOptions}
                />
            </Stack.Navigator>
        </Layout>
    );
});