import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/context/SessionContext';
import { Layout } from '@/components/Layout';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';

interface Post {
    uuid: string;
    image_url: string;
    description: string;
}

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

export function ProfileMain() {
    const navigation = useNavigation<ProfileNavigationProp>();
    const { user, username, signOut } = useSession();
    const queryClient = useQueryClient();

    const { data: posts, isLoading } = useQuery({
        queryKey: ['userPosts', user?.id],
        queryFn: async () => {
            console.log('Fetching posts for user:', user?.id);
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('user_uuid', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(post => ({
                ...post,
                image_url: supabase.storage
                    .from('outfits')
                    .getPublicUrl(post.image_url).data.publicUrl
            }));
        },
    });

    useEffect(() => {
        if (!user?.id) return;

        // Subscribe to real-time changes
        const subscription = supabase
            .channel('posts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'posts',
                    filter: `user_uuid=eq.${user.id}` // Only listen for this user's posts
                },
                (payload) => {
                    console.log('New post detected:', payload);
                    // Invalidate and refetch
                    queryClient.invalidateQueries({ queryKey: ['userPosts', user.id] });
                }
            )
            .subscribe();

        // Cleanup subscription
        return () => {
            subscription.unsubscribe();
        };
    }, [user?.id, queryClient]);

    const renderPost = ({ item }: { item: Post }) => (
        <TouchableOpacity
            style={styles.postItem}
            onPress={() => navigation.navigate('PostDetails', { postId: item.uuid })}
        >
            <Image
                source={{ uri: item.image_url }}
                style={styles.image}
                contentFit="cover"
            />
        </TouchableOpacity>
    );

    return (
        <Layout>
            <View style={styles.container}>
                <Text style={styles.username}>@{username}</Text>
                {isLoading ? (
                    <Text>Loading...</Text>
                ) : (
                    <FlashList
                        data={posts}
                        renderItem={renderPost}
                        numColumns={3}
                        estimatedItemSize={124}
                    />
                )}
                <Button title="Sign Out" onPress={signOut} color="#FF3B30" />
            </View>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        padding: 20,
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