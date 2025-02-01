import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { useRoute, RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import type { DiscoverTabParamList } from '@/navigation/types';

type UserProfileRouteProp = RouteProp<DiscoverTabParamList, 'UserProfile'>;

interface Post {
    uuid: string;
    image_url: string;
}

export function UserProfile() {
    const [username, setUsername] = useState<string | null>(null);
    const route = useRoute<UserProfileRouteProp>();

    useEffect(() => {
        if (!route.params) return;
        setUsername(route.params.username);
    }, [route.params]);

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['user', username],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')  // Changed from 'users' to 'profiles'
                .select('id')      // Changed from 'uuid' to 'id'
                .eq('username', username)
                .single();
            if (error) throw error;
            return data;
        }
    });

    const { data: posts, isLoading: postsLoading } = useQuery({
        queryKey: ['userPosts', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];  // Return empty array if no user

            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('user_uuid', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(post => ({
                ...post,
                image_url: supabase.storage
                    .from('outfits')
                    .getPublicUrl(post.image_url).data.publicUrl
            }));
        },
        enabled: !!user?.id, // Only run this query when we have a user id
    });

    const renderPost = ({ item }: { item: Post }) => (
        <View style={styles.postItem}>
            <Image
                source={{ uri: item.image_url }}
                style={styles.image}
                contentFit="cover"
            />
        </View>
    );

    if (userLoading) {
        return (
            <Layout>
                <View style={styles.container}>
                    <Text>Loading user...</Text>
                </View>
            </Layout>
        );
    }

    if (!user) {
        return (
            <Layout>
                <View style={styles.container}>
                    <Text>User not found</Text>
                </View>
            </Layout>
        );
    }

    return (
        <Layout>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.userIcon}>
                        <MaterialIcons name="person" size={40} color="black" />
                    </View>
                    <Text style={styles.username}>@{username}</Text>
                </View>
                {postsLoading ? (
                    <Text>Loading posts...</Text>
                ) : (
                    <FlashList
                        data={posts}
                        renderItem={renderPost}
                        numColumns={3}
                        estimatedItemSize={124}
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 20,
        alignItems: 'center',
        width: '100%',
    },
    userIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    postItem: {
        flex: 1,
        aspectRatio: 1,
        margin: 1,
    },
    image: {
        width: '100%',
        height: '100%',
    },
}); 