import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { BrandsStackParamList } from '@/navigation/types';
import { Layout } from '@/components/Layout';

type BrandDetailsRouteProp = RouteProp<BrandsStackParamList, 'BrandDetails'>;

interface Post {
    uuid: string;
    image_url: string;
    description: string;
    user: {
        username: string;
    };
}

export function BrandDetails() {
    const route = useRoute<BrandDetailsRouteProp>();
    const { brandId, brandName } = route.params;

    const { data: posts, isLoading } = useQuery({
        queryKey: ['brandPosts', brandId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('post_brands')
                .select(`
                    posts (
                        uuid,
                        image_url,
                        description,
                        profiles!posts_user_uuid_fkey (
                            username
                        )
                    )
                `)
                .eq('brand_id', brandId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(({ posts: post }) => ({
                uuid: post.uuid,
                image_url: supabase.storage
                    .from('outfits')
                    .getPublicUrl(post.image_url).data.publicUrl,
                description: post.description,
                user: {
                    username: post.profiles.username
                }
            }));
        },
    });

    const renderPost = ({ item }: { item: Post }) => (
        <View style={styles.postItem}>
            <Image
                source={{ uri: item.image_url }}
                style={styles.image}
                contentFit="cover"
            />
            <Text style={styles.username}>@{item.user.username}</Text>
        </View>
    );

    return (
        <Layout>
            <View style={styles.container}>
                <Text style={styles.title}>{brandName}</Text>
                {isLoading ? (
                    <Text>Loading...</Text>
                ) : !posts?.length ? (
                    <Text>No posts yet</Text>
                ) : (
                    <FlashList
                        data={posts}
                        renderItem={renderPost}
                        numColumns={2}
                        estimatedItemSize={200}
                    />
                )}
            </View>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        padding: 20,
    },
    postItem: {
        flex: 1,
        margin: 5,
    },
    image: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 10,
    },
    username: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
}); 