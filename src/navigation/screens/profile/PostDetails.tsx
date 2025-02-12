import React from 'react';
import { View, Text, StyleSheet, Alert, Button } from 'react-native';
import { Image } from 'expo-image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { ProfileStackParamList } from '@/types';
import { Layout } from '@/components/Layout';

type PostDetailsRouteProp = RouteProp<ProfileStackParamList, 'PostDetails'>;

interface Post {
    uuid: string;
    image_url: string;
    description: string;
    created_at: string;
    brands: Array<{
        name: string;
    }>;
}

export function PostDetails() {
    const route = useRoute<PostDetailsRouteProp>();
    const navigation = useNavigation();
    const queryClient = useQueryClient();
    const { postId } = route.params;

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
                    post_brands (
                        brands (
                            name
                        )
                    )
                `)
                .eq('uuid', postId)
                .single();

            if (error) throw error;

            return {
                ...data,
                brands: data.post_brands.map((pb: any) => pb.brands),
                image_url: supabase.storage
                    .from('outfits')
                    .getPublicUrl(data.image_url).data.publicUrl
            };
        },
    });

    const handleDelete = async () => {
        Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Delete post_brands entries first
                            await supabase
                                .from('post_brands')
                                .delete()
                                .eq('post_uuid', postId);

                            // Then delete the post
                            const { error } = await supabase
                                .from('posts')
                                .delete()
                                .eq('uuid', postId);

                            if (error) throw error;

                            // Invalidate queries to refresh the profile
                            queryClient.invalidateQueries({ queryKey: ['userPosts'] });

                            // Navigate back
                            navigation.goBack();
                        } catch (error: any) {
                            Alert.alert('Error', error.message);
                        }
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <Layout>
                <View style={styles.container}>
                    <Text>Loading...</Text>
                </View>
            </Layout>
        );
    }
    if (!post) {
        return (
            <Layout>
                <View style={styles.container}>
                    <Text>Post not found</Text>
                </View>
            </Layout>
        );
    }

    return (
        <View style={styles.container}>
            <Image
                source={{ uri: post.image_url }}
                style={styles.image}
                contentFit="cover"
            />
            <View style={styles.detailsContainer}>
                <Text style={styles.date}>
                    {new Date(post.created_at).toLocaleDateString()}
                </Text>
                {post.description && (
                    <Text style={styles.description}>{post.description}</Text>
                )}
                <View style={styles.brandsContainer}>
                    <Text style={styles.brandsLabel}>Featured Brands:</Text>
                    <View style={styles.brandsList}>
                        {post.brands.map((brand, index) => (
                            <View key={index} style={styles.brandButton}>
                                <Text style={styles.brandText}>{brand.name}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                <Button
                    title="Delete Post"
                    onPress={handleDelete}
                    color="#FF3B30"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    image: {
        width: '100%',
        height: 400,
    },
    detailsContainer: {
        padding: 20,
    },
    date: {
        color: '#666',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        marginBottom: 20,
    },
    brandsContainer: {
        marginBottom: 20,
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