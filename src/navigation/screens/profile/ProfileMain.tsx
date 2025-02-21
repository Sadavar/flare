import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSession } from '@/context/SessionContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Post, ProfileStackParamList } from '@/types';
import { useUserPosts } from '@/hooks/usePostQueries';
import { useQueryClient } from '@tanstack/react-query';
import { PaginatedGridList } from '@/components/PaginatedGridList';

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

export function ProfileMain() {
    const navigation = useNavigation<ProfileNavigationProp>();
    const { user, username = '' } = useSession();
    const queryClient = useQueryClient();
    const PAGE_SIZE = 5; // Number of posts per page

    // Get user posts with pagination
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch
    } = useUserPosts(username || "", PAGE_SIZE);

    // Flatten posts from all pages
    const allPosts = data?.pages?.flat() || [];

    // Handle refresh
    const handleRefresh = useCallback(() => {
        refetch({ refetchPage: (_data, index) => index === 0 });
    }, [refetch]);

    // Refetch when profile screen is focused
    useFocusEffect(
        useCallback(() => {
            handleRefresh();
        }, [handleRefresh])
    );

    // Render each post
    const renderPost = useCallback(({ item }: { item: Post }) => (
        <TouchableOpacity
            style={styles.postItem}
            onPress={() => navigation.navigate('PostDetails', { post: item })}
        >
            <Image
                source={{ uri: item.image_url }}
                style={styles.image}
                contentFit="cover"
            />
        </TouchableOpacity>
    ), [navigation]);

    // Render the profile header
    const ProfileHeader = useCallback(() => (
        <View style={styles.header}>
            <View style={styles.profileSection}>
                <View style={styles.userIcon}>
                    <MaterialIcons name="person" size={40} color="black" />
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.username}>@{username}</Text>
                    <Text style={styles.bio}>professional frollicker | NYC 📍</Text>
                </View>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{allPosts.length || 0}</Text>
                    <Text style={styles.statLabel}>Posts</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>1.2K</Text>
                    <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>45</Text>
                    <Text style={styles.statLabel}>Brands</Text>
                </View>
            </View>
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                <MaterialIcons name="refresh" size={24} color="black" />
            </TouchableOpacity>
        </View>
    ), [username, allPosts.length, handleRefresh]);

    // Create empty component for user posts
    const EmptyComponent = useCallback(() => (
        <Text style={styles.emptyText}>No posts yet</Text>
    ), []);

    return (
        <View style={styles.container}>
            <ProfileHeader />

            <PaginatedGridList
                data={allPosts}
                renderItem={renderPost}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                isLoading={isLoading}
                isError={isError}
                refetch={handleRefresh}
                keyExtractor={(item) => item.uuid}
                numColumns={3}
                estimatedItemSize={124}
                emptyComponent={<EmptyComponent />}
                loadingMoreText="Loading more posts..."
                contentContainerStyle={styles.listContent}
                listProps={{
                    ListHeaderComponent: null,
                    showsVerticalScrollIndicator: false,
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    userIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    bio: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
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
    listContent: {
        paddingTop: 0,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#666',
        fontSize: 16,
    },
    refreshButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 10,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
});