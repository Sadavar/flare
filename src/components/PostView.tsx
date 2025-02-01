import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/context/SessionContext';
import { useNavigation } from '@react-navigation/native';

interface PostViewProps {
    postId: string;
}

export function PostView({ postId }: PostViewProps) {
    const { username: currentUsername } = useSession();
    const navigation = useNavigation();

    const { data: post, isLoading } = useQuery({
        queryKey: ['post', postId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    uuid,
                    image_url,
                    description,
                    created_at,
                    profiles!posts_user_uuid_fkey (username),
                    post_brands (
                        brands (
                            id,
                            name
                        )
                    )
                `)
                .eq('uuid', postId)
                .single();

            if (error) throw error;

            return {
                ...data,
                user: data.profiles,
                brands: data.post_brands.map((pb: any) => pb.brands),
                image_url: supabase.storage
                    .from('outfits')
                    .getPublicUrl(data.image_url).data.publicUrl
            };
        },
    });

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!post) {
        return (
            <View style={styles.container}>
                <Text>Post not found</Text>
            </View>
        );
    }

    const handleUserPress = (username: string) => {
        console.log(username);
        if (username === currentUsername) {
            navigation.getParent()?.navigate('Profile', {
                screen: 'ProfileMain'
            });
        } else {
            navigation.navigate('Global', {
                screen: 'UserProfile',
                params: { username }
            });
        }
    }

    const handleBrandPress = (brandId: number, brandName: string) => {
        console.log(brandId, brandName);
        navigation.navigate('Brands', {
            screen: 'BrandDetails',
            params: { brandId, brandName }
        });
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.userInfo}
                    onPress={() => { handleUserPress(post.user.username) }}
                >
                    <View style={styles.userIcon}>
                        <MaterialIcons name="person" size={24} color="black" />
                    </View>
                    <Text style={styles.username}>@{post.user.username}</Text>
                </TouchableOpacity>
            </View>

            <Image
                source={{ uri: post.image_url }}
                style={styles.image}
                contentFit="cover"
            />

            {post.description && (
                <Text style={styles.description}>{post.description}</Text>
            )}

            <View style={styles.brandsContainer}>
                <Text style={styles.brandsLabel}>Featured Brands:</Text>
                <View style={styles.brandsList}>
                    {post.brands?.map((brand) => (
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
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
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
    image: {
        width: '100%',
        aspectRatio: 1,
    },
    description: {
        fontSize: 14,
        padding: 15,
    },
    brandsContainer: {
        padding: 15,
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