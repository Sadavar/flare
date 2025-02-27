import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type {
    RootStackParamList,
    MainTabParamList,
    DiscoverTabParamList,
    GlobalStackParamList,
    BrandsStackParamList,
    ProfileStackParamList,
    Post
} from '@/types';
import { useSession } from '@/context/SessionContext';
import { theme } from '@/context/ThemeContext';
import { CustomText } from './CustomText';

// Create a composite navigation type that can access all needed stacks
type MiniPostNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    CompositeNavigationProp<
        NativeStackNavigationProp<RootStackParamList>,
        CompositeNavigationProp<
            NativeStackNavigationProp<GlobalStackParamList>,
            CompositeNavigationProp<
                NativeStackNavigationProp<BrandsStackParamList>,
                NativeStackNavigationProp<ProfileStackParamList>
            >
        >
    >
>;

function MiniPostCard({ post }: { post: Post }) {
    const navigation = useNavigation<MiniPostNavigationProp>();
    const { username } = useSession();
    const route = useRoute();

    if (!post) return null;

    const handlePostPress = () => {
        console.log(route.name)
        // If we're already in a user's profile view
        if (route.name === 'ProfileMain') {
            // Stay in the current stack and just navigate to PostDetails
            navigation.navigate('PostDetails', { post });
        } else if (post.username === username) {
            // If it's the user's own post, navigate to Profile tab
            navigation.navigate('Main', {
                screen: 'Profile',
                params: {
                    screen: 'PostDetails',
                    params: { post }
                }
            });
        } else {
            // If it's another user's post from outside their profile, navigate to Global stack
            navigation.navigate('Main', {
                screen: 'Discover',
                params: {
                    screen: 'Global',
                    params: {
                        screen: 'PostDetails',
                        params: { post }
                    }
                }
            });
        }
    };

    const handleBrandPress = (brandId: number, brandName: string) => {
        navigation.navigate('Main', {
            screen: 'Discover',
            params: {
                screen: 'Brands',
                params: {
                    screen: 'BrandDetails',
                    params: { brandId, brandName }
                }
            }
        });
    };

    return (
        <View style={styles.container}>
            {/* Image with TouchableOpacity */}
            <TouchableOpacity onPress={handlePostPress}>
                <Image
                    source={{ uri: post.image_url }}
                    style={styles.image}
                    contentFit="cover"
                    transition={300}
                />
            </TouchableOpacity>

            {/* Details section */}
            <View style={styles.details}>
                {/* Color dots */}
                {post.colors && post.colors.length > 0 && (
                    <View style={styles.colorDotsContainer}>
                        {post.colors.slice(0, 3).map((color) => (
                            <View
                                key={color.id}
                                style={[
                                    styles.colorDot,
                                    { backgroundColor: color.hex_value }
                                ]}
                            />
                        ))}
                    </View>
                )}

                {/* Brands */}
                {post.brands && post.brands.length > 0 && (
                    <View style={styles.brandsContainer}>
                        {post.brands.slice(0, 1).map((brand) => (
                            <TouchableOpacity
                                key={brand.id}
                                style={styles.brandPill}
                                onPress={() => handleBrandPress(brand.id, brand.name)}
                            >
                                <CustomText style={styles.brandText}>{brand.name}</CustomText>
                            </TouchableOpacity>
                        ))}
                        {post.brands.length > 1 && (
                            <View style={styles.brandPill}>
                                <CustomText style={styles.brandText}>+{post.brands.length - 1}</CustomText>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 120,
        marginRight: 12,
        borderRadius: 12,
        backgroundColor: theme.colors.light_background_1,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 2,
        // overflow: 'hidden',
    },
    image: {
        width: '100%',
        aspectRatio: 0.75, // 3:4 aspect ratio
        borderRadius: 12
    },
    details: {
        padding: 8,
    },
    colorDotsContainer: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 8,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 4,
        shadowColor: theme.colors.light_background_2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 5,
    },
    brandsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,

    },
    brandPill: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: theme.colors.light_background_2,
        borderRadius: 6,
    },
    brandText: {
        fontSize: 10,
    },
});

export default MiniPostCard;