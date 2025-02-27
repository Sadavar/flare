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
import { FollowList } from './FollowList';
import { Layout } from '@/components/Layout';
import { CustomText } from '@/components/CustomText';
import { theme } from '@/context/ThemeContext';

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
        navigation.navigate('AllPosts', { type: 'posts' });
    }, [navigation]);

    const handleSeeAllSavedPosts = useCallback(() => {
        navigation.navigate('AllPosts', { type: 'saved' });
    }, [navigation]);

    // Render the profile header
    const ProfileHeader = useCallback(() => (
        <View style={styles.header}>
            <View style={styles.profileSection}>
                <View style={styles.userIcon}>
                    <MaterialIcons name="person" size={40} color="black" />
                </View>
                <View style={styles.userInfo}>
                    <CustomText style={styles.username}>@{username}</CustomText>
                    <CustomText style={styles.bio}>professional frollicker | NYC 📍</CustomText>
                </View>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <CustomText style={styles.statNumber}>{allPosts.length || 0}</CustomText>
                    <CustomText style={styles.statLabel}>Posts</CustomText>
                </View>
                <TouchableOpacity
                    style={styles.statItem}
                    onPress={() => navigation.navigate('FollowList')}
                >
                    <MaterialIcons name="people" size={24} color={theme.colors.text} />
                    <CustomText style={styles.statLabel}>Friends</CustomText>
                </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                <MaterialIcons name="refresh" size={24} color="black" />
            </TouchableOpacity>
        </View>
    ), [username, allPosts.length, handleRefresh, navigation]);

    return (
        <ScrollView

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
                onSeeAll={handleSeeAllSavedPosts}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.light_background_1,
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
        color: theme.colors.light_background_2,
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
        color: theme.colors.light_background_3,
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