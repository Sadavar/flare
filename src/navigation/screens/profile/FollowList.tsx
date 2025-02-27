import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/context/SessionContext';
import { useNavigation } from '@react-navigation/native';
import { useFollowUser } from '@/hooks/useFollowQueries';
import { CustomText } from '@/components/CustomText';
import { theme } from '@/context/ThemeContext';

type FollowData = {
    profiles: {
        id: string;
        username: string;
    };
};

export function FollowList() {
    const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following');
    const { user } = useSession();
    const navigation = useNavigation();
    const { mutate: toggleFollow, isLoading: isFollowLoading } = useFollowUser();
    const [unfollowingIds, setUnfollowingIds] = useState<Set<string>>(new Set());

    const { data: following = [] } = useQuery({
        queryKey: ['following', user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('follows')
                .select(`
                    following_id,
                    profiles!follows_following_id_fkey (
                        id,
                        username
                    )
                `)
                .eq('follower_id', user?.id);
            return data || [];
        },
        enabled: !!user?.id
    });

    const { data: followers = [] } = useQuery({
        queryKey: ['followers', user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('follows')
                .select(`
                    follower_id,
                    profiles!follows_follower_id_fkey (
                        id,
                        username
                    )
                `)
                .eq('following_id', user?.id);
            return data || [];
        },
        enabled: !!user?.id
    });

    const handleUnfollow = (targetUserId: string) => {
        setUnfollowingIds(prev => new Set(prev).add(targetUserId));

        toggleFollow(
            { targetUserId, isFollowing: true },
            {
                onSuccess: () => {
                    setUnfollowingIds(prev => {
                        const next = new Set(prev);
                        next.delete(targetUserId);
                        return next;
                    });
                },
                onError: () => {
                    setUnfollowingIds(prev => {
                        const next = new Set(prev);
                        next.delete(targetUserId);
                        return next;
                    });
                }
            }
        );
    };

    const handleUserPress = (username: string) => {
        navigation.navigate('UserProfile', { username });
    };

    const renderUser = ({ item }: { item: FollowData }) => {
        const userData = activeTab === 'following' ? item.profiles : item.profiles;
        const isUnfollowing = unfollowingIds.has(userData.id);

        return (
            <View style={styles.userRow}>
                <TouchableOpacity
                    style={styles.userInfo}
                    onPress={() => handleUserPress(userData.username)}
                >
                    <MaterialIcons name="person" size={24} color="#666" />
                    <CustomText style={styles.username}>@{userData.username}</CustomText>
                </TouchableOpacity>

                {activeTab === 'following' && (
                    <TouchableOpacity
                        style={[
                            styles.unfollowButton,
                            isUnfollowing && styles.unfollowButtonLoading
                        ]}
                        onPress={() => handleUnfollow(userData.id)}
                        disabled={isUnfollowing}
                    >
                        <CustomText style={[
                            styles.unfollowText,
                            isUnfollowing && styles.unfollowTextLoading
                        ]}>
                            {isUnfollowing ? 'Unfollowing...' : 'Unfollow'}
                        </CustomText>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'following' && styles.activeTab]}
                    onPress={() => setActiveTab('following')}
                >
                    <CustomText style={[
                        styles.tabText,
                        activeTab === 'following' && styles.activeTabText
                    ]}>
                        Following ({following.length})
                    </CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
                    onPress={() => setActiveTab('followers')}
                >
                    <CustomText style={[
                        styles.tabText,
                        activeTab === 'followers' && styles.activeTabText
                    ]}>
                        Followers ({followers.length})
                    </CustomText>
                </TouchableOpacity>
            </View>

            <FlatList
                data={activeTab === 'following' ? following : followers}
                renderItem={renderUser}
                keyExtractor={(item) => item.profiles.id}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabBar: {
        flexDirection: 'row',
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        fontSize: 16,
    },
    activeTabText: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    list: {
        padding: 15,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    username: {
        marginLeft: 10,
        fontSize: 16,
    },
    unfollowButton: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    unfollowText: {
        color: '#666',
        fontSize: 14,
    },
    unfollowButtonLoading: {
        backgroundColor: '#e0e0e0',
        opacity: 0.7,
    },
    unfollowTextLoading: {
        color: '#999',
    },
}); 