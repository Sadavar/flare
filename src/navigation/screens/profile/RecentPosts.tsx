import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MiniPostCard from '../../../components/MiniPostCard';
import { Post } from '@/types';

function RecentPosts({ data, onSeeAll }: { data: Post[], onSeeAll: any }) {
    const allPosts = data
    console.log(allPosts.length)

    if (!allPosts || allPosts.length === 0) {
        return (
            <View style={styles.section}>
                <View style={styles.header}>
                    <Text style={styles.title}>Recent Posts</Text>
                </View>
                <Text style={styles.emptyText}>No Posts Yet</Text>
            </View>
        );
    }

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <Text style={styles.title}>Recent Posts</Text>
                <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={onSeeAll}
                >
                    <Text style={styles.seeAllText}>See All Posts</Text>
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
});

export default RecentPosts;