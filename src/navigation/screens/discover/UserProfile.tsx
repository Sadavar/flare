import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Layout } from '@/components/Layout';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import type { DiscoverTabParamList } from '@/types';
import { useUserPosts, Post } from '@/hooks/usePostQueries';
import { useSession } from '@/context/SessionContext';

type UserProfileRouteProp = RouteProp<DiscoverTabParamList, 'UserProfile'>;

export function UserProfile() {
    const route = useRoute<UserProfileRouteProp>();
    const navigation = useNavigation();
    const { username: routeUsername } = route.params || {};
    const { username: currentUsername } = useSession();

    const { data: posts, isLoading: postsLoading } = useUserPosts(routeUsername || '');

    const handlePostPress = (postId: string) => {
        if (routeUsername === currentUsername) {
            navigation.navigate('Profile', {
                screen: 'PostDetails',
                params: { postId }
            });
        } else {
            navigation.navigate('PostDetails', { postId });
        }
    };

    const renderPost = ({ item }: { item: Post }) => (
        <TouchableOpacity
            style={styles.postItem}
            onPress={() => handlePostPress(item.uuid)}
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: item.image_url }}
                style={styles.image}
                contentFit="cover"
            />
            {item.brands.length > 0 && (
                <View style={styles.brandCount}>
                    <Text style={styles.brandCountText}>
                        {item.brands.length}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );

    if (!routeUsername) {
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
                    <Text style={styles.username}>@{routeUsername}</Text>
                    <Text style={styles.postCount}>
                        {posts?.length || 0} Posts
                    </Text>
                </View>
                {postsLoading ? (
                    <View style={styles.loadingContainer}>
                        <Text>Loading posts...</Text>
                    </View>
                ) : (
                    <FlashList
                        data={posts}
                        renderItem={renderPost}
                        numColumns={3}
                        estimatedItemSize={124}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No posts yet</Text>
                            </View>
                        }
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 20,
        alignItems: 'center',
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
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
        marginBottom: 5,
    },
    postCount: {
        fontSize: 14,
        color: '#666',
    },
    postItem: {
        flex: 1,
        aspectRatio: 1,
        margin: 1,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    brandCount: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    brandCountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
});