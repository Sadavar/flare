import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Layout } from '@/components/Layout';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ProfileStackParamList } from '@/navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type UserProfileRouteProp = RouteProp<ProfileStackParamList, 'UserProfile'>;
type UserProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'UserProfile'>;

interface Post {
    uuid: string;
    image_url: string;
}

export function UserProfile() {
    const route = useRoute<UserProfileRouteProp>();
    const navigation = useNavigation<UserProfileNavigationProp>();
    const { userId, username } = route.params;

    const { data: posts, isLoading } = useQuery({
        queryKey: ['userPosts', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('user_uuid', userId)
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
                <View style={styles.header}>
                    <View style={styles.userIcon}>
                        <MaterialIcons name="person" size={40} color="black" />
                    </View>
                    <Text style={styles.username}>@{username}</Text>
                </View>
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
            </View>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 20,
        alignItems: 'center',
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