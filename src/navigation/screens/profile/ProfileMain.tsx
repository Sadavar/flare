import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSession } from '@/context/SessionContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Color, Post, ProfileStackParamList } from '@/types';
import { useGetSavedPosts, useUserPostsAll } from '@/hooks/usePostQueries';
import { useQueryClient } from '@tanstack/react-query';
import { PaginatedGridList } from '@/components/PaginatedGridList';
import PostCard from '@/components/PostCard';
import RecentPosts from './RecentPosts';
import SavedPosts from './SavedPosts';
type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

export function ProfileMain() {
    const navigation = useNavigation<ProfileNavigationProp>();
    const { user, username = '' } = useSession();
    const queryClient = useQueryClient();

    // Get all user posts
    const { data: allPosts = [], refetch } = useUserPostsAll(username);

    const { data: savedPosts = [] } = useGetSavedPosts(user.id);

    // Filter saved posts
    console.log("saved posts: ", savedPosts)
    console.log(allPosts.length, savedPosts.length)

    // Handle refresh
    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    const handleSeeAllPosts = useCallback(() => {
        // You can navigate to a grid view of all posts or implement your desired behavior
        navigation.navigate('AllPosts'); // Make sure to define this route in your navigation
    }, [navigation]);

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
                    <Text style={styles.statNumber}>45</Text>
                    <Text style={styles.statLabel}>Saves</Text>
                </View>
            </View>
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                <MaterialIcons name="refresh" size={24} color="black" />
            </TouchableOpacity>
        </View>
    ), [username, allPosts.length, handleRefresh]);

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={false}
                    onRefresh={handleRefresh}
                    tintColor="#007AFF"
                    title="Pull to refresh..."
                />
            }
        >
            <ProfileHeader />
            <RecentPosts data={allPosts} onSeeAll={handleSeeAllPosts} />
            <SavedPosts
                data={savedPosts}
                onSeeAll={() => { console.log('see all saved posts clicked') }}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
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