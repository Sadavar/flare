import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MiniPostCard from '../../../components/MiniPostCard';
import { CustomText } from '@/components/CustomText';

function SavedPosts({ data, onSeeAll }) {
    const allPosts = data

    if (!allPosts || allPosts.length === 0) {
        return (
            <View style={styles.section}>
                <View style={styles.header}>
                    <CustomText style={styles.title}>Saved Posts</CustomText>
                </View>
                <CustomText style={styles.emptyText}>No Saved Posts Yet</CustomText>
            </View>
        );
    }

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <CustomText style={styles.title}>Saved Posts</CustomText>
                <TouchableOpacity
                    style={styles.seeAllButton}
                    onPress={onSeeAll}
                >
                    <CustomText style={styles.seeAllText}>See All Saved</CustomText>
                    <MaterialIcons name="chevron-right" size={20} color="#666" />
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {allPosts.slice(0, 10).map((post) => (
                    <MiniPostCard key={post.uuid} post={post} />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
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

export default SavedPosts;