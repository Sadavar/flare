import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MiniPostCard from '../../../components/MiniPostCard';
import { Post } from '@/types';
import { CustomText } from '@/components/CustomText';
import { SkeletonLoader } from '@/components/SkeletonLoader';

interface Props {
    data: Post[];
    onSeeAll: () => void;
    isLoading?: boolean;
}

function RecentPosts({ data, onSeeAll, isLoading = false }: Props) {
    const allPosts = data
    console.log(allPosts.length)

    if (isLoading) {
        return (
            <View style={styles.section}>
                <View style={styles.header}>
                    <CustomText style={styles.title}>Recent Posts</CustomText>
                    <TouchableOpacity
                        style={styles.seeAllButton}
                        onPress={onSeeAll}
                    >
                        <CustomText style={styles.seeAllText}>See All Posts</CustomText>
                        <MaterialIcons name="chevron-right" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {[1, 2, 3, 4].map((_, index) => (
                        <View key={index} style={styles.skeletonCard}>
                            <SkeletonLoader width="100%" height="100%" />
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    if (!allPosts || allPosts.length === 0) {
        return (
            <View style={styles.section}>
                <View style={styles.header}>
                    <CustomText style={styles.title}>Recent Posts</CustomText>
                </View>
                <CustomText style={styles.emptyText}>No Posts Yet</CustomText>
            </View>
        );
    }

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <CustomText style={styles.title}>Recent Posts</CustomText>
                <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={onSeeAll}
                >
                    <CustomText style={styles.seeAllText}>See All Posts</CustomText>
                    <MaterialIcons name="chevron-right" size={20} color="#666" />
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {allPosts.slice(0, 10).map((post: Post) => (
                    <MiniPostCard key={post.uuid} post={post} />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 50,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    seeAllText: {
        fontSize: 14,
        color: '#666',
        marginRight: 4,
    },
    scrollContent: {
        paddingRight: 20, // Extra padding at the end of scroll
    },
    emptyText: {
        color: '#666',
        fontSize: 14,
    },
    skeletonCard: {
        width: 150,
        height: 200,
        marginRight: 10,
        borderRadius: 8,
        overflow: 'hidden',
    },
});

export default RecentPosts;