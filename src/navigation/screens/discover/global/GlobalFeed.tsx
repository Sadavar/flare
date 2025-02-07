import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Button } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { GlobalStackParamList } from '@/navigation/types';
import { useSession } from '@/context/SessionContext';

interface Post {
    uuid: string;
    image_url: string;
    description: string;
    user: {
        username: string;
    };
    brands: Array<{
        id: number;
        name: string;
    }>;
}

type GlobalFeedNavigationProp = NativeStackNavigationProp<GlobalStackParamList, 'GlobalFeed'>;

export function GlobalFeed() {
    const navigation = useNavigation<GlobalFeedNavigationProp>();
    const { user: currentUser, username: currentUsername } = useSession();

    const { data: posts, isLoading } = useQuery({
        queryKey: ['globalFeed'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    uuid,
                    image_url,
                    description,
                    created_at,
                    user_uuid,
                    profiles!posts_user_uuid_fkey (username),
                    post_brands (
                        brands (
                            id,
                            name
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(post => ({
                ...post,
                user: { username: post.profiles[0]?.username },
                brands: post.post_brands.map((pb: any) => pb.brands),
                image_url: supabase.storage
                    .from('outfits')
                    .getPublicUrl(post.image_url).data.publicUrl
            }));
        },
    });

    const handleBrandPress = (brandId: number, brandName: string) => {
        navigation.getParent()?.navigate('Brands', {
            screen: 'BrandDetails',
            params: { brandId, brandName }
        });
    };

    const handleProfilePress = (username: string) => {
        if (username === currentUsername) {
            navigation.getParent()?.navigate('Profile', {
                screen: 'ProfileMain'
            });
        } else {
            navigation.navigate('UserProfile', { username });
        }
    };

    const renderPost = ({ item }: { item: Post }) => (
        <View style={styles.postContainer}>
            <View style={styles.postHeader}>
                <TouchableOpacity
                    style={styles.userInfo}
                    onPress={() => handleProfilePress(item.user.username)}
                >
                    <View style={styles.userIcon}>
                        <MaterialIcons name="person" size={24} color="black" />
                    </View>
                    <Text style={styles.username}>@{item.user.username}</Text>
                </TouchableOpacity>
            </View>

            <Image
                source={{ uri: item.image_url }}
                style={styles.postImage}
                contentFit="cover"
                transition={0}
            />

            <View style={styles.brandsContainer}>
                <Text style={styles.brandsLabel}>Featured Brands:</Text>
                <View style={styles.brandsList}>
                    {item.brands?.map((brand) => (
                        <TouchableOpacity
                            key={brand.id}
                            style={styles.brandButton}
                            onPress={() => handleBrandPress(brand.id, brand.name)}
                        >
                            <Text style={styles.brandText}>{brand.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!posts?.length) {
        return (
            <View style={styles.container}>
                <Text>No posts yet</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlashList
                data={posts}
                renderItem={renderPost}
                estimatedItemSize={400}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    postContainer: {
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    username: {
        fontSize: 14,
        fontWeight: '600',
    },
    postImage: {
        width: '100%',
        aspectRatio: 1,
    },
    brandsContainer: {
        padding: 10,
    },
    brandsLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5,
    },
    brandsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
    },
    brandButton: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    brandText: {
        fontSize: 12,
        color: '#000',
    },
});