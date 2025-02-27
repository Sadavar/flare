import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Layout } from '@/components/Layout';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import type { DiscoverTabParamList, Post } from '@/types';
import { useUserPostsAll } from '@/hooks/usePostQueries';
import { useSession } from '@/context/SessionContext';
import RecentPosts from '../profile/RecentPosts';
import { useIsFollowing, useFollowUser } from '@/hooks/useFollowQueries';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CustomText } from '@/components/CustomText';
import { theme } from '@/context/ThemeContext';

type UserProfileRouteProp = RouteProp<DiscoverTabParamList, 'UserProfile'>;

export function UserProfile() {
    const route = useRoute<UserProfileRouteProp>();
    const navigation = useNavigation();
    const { username, initialScreen, postData } = route.params || {};
    const { user: currentUser } = useSession();

    const { data: allPosts = [], isLoading: postsLoading, refetch } = useUserPostsAll(username || '');

    // Get target user's ID
    const { data: targetUser } = useQuery({
        queryKey: ['user', username],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username')
                .eq('username', username)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!username
    });

    // Check if following
    const { data: isFollowing = false } = useIsFollowing(targetUser?.id);
    const { mutate: toggleFollow } = useFollowUser();

    // Handle initial navigation if needed
    useEffect(() => {
        if (initialScreen === 'PostDetails' && postData) {
            navigation.navigate('PostDetails', { post: postData });
        }
    }, []);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    const handleFollowPress = () => {
        if (!targetUser?.id) return;

        toggleFollow(
            {
                targetUserId: targetUser.id,
                isFollowing
            },
            {
                onError: (error) => {
                    console.error('Error toggling follow:', error);
                    // You might want to show an error toast here
                }
            }
        );
    };

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
                    <CustomText style={styles.statNumber}>{allPosts?.length || 0}</CustomText>
                    <CustomText style={styles.statLabel}>Posts</CustomText>
                </View>
                <View style={styles.statItem}>
                    <CustomText style={styles.statNumber}>45</CustomText>
                    <CustomText style={styles.statLabel}>Saves</CustomText>
                </View>
            </View>
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                <MaterialIcons name="refresh" size={24} color="black" />
            </TouchableOpacity>
        </View>
    ), [username, allPosts?.length, handleRefresh]);

    if (!username) {
        return (
            <Layout>
                <View style={styles.container}>
                    <CustomText>User not found</CustomText>
                </View>
            </Layout>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <ProfileHeader />
            {currentUser && username !== currentUser.username && (
                <TouchableOpacity
                    style={[
                        styles.followButton,
                        isFollowing && styles.followingButton
                    ]}
                    onPress={handleFollowPress}
                >
                    <CustomText style={[
                        styles.followButtonText,
                        isFollowing && styles.followingButtonText
                    ]}>
                        {isFollowing ? 'Following' : 'Follow'}
                    </CustomText>
                </TouchableOpacity>
            )}
            <RecentPosts data={allPosts} onSeeAll={() => console.log("see all clicked")} />
            {/* <SavedPosts
                data={savedPosts}
                onSeeAll={() => { console.log('see all saved posts clicked') }}
            /> */}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
    },
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
    followButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        marginHorizontal: 20,
        marginVertical: 10,
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
    },
    followingButton: {
        backgroundColor: theme.colors.light_background_1,
    },
    followButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    followingButtonText: {
        color: 'white',
    },
});