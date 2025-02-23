import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { BrandsStackParamList } from '@/types';
import { Layout } from '@/components/Layout';
import { useNavigation } from '@react-navigation/native';
import { Post } from '@/types'
import { PaginatedGridList } from '@/components/PaginatedGridList';
import PostCard from '@/components/PostCard';
import { usePostsWithBrandFeed } from '@/hooks/usePostQueries';


type BrandDetailsRouteProp = RouteProp<BrandsStackParamList, 'BrandDetails'>;

function Header({ brandName, posts_length }: { brandName: string, posts_length: number }) {
    return (
        <View style={styles.header}>
            <View style={styles.profileSection}>
                <View style={styles.brandIcon}>
                    <MaterialIcons name="store" size={40} color="black" />
                </View>
                <View style={styles.brandInfo}>
                    <Text style={styles.brandName}>{brandName}</Text>
                    <Text style={styles.bio}>Premium fashion brand | Est. 2023</Text>
                </View>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>0</Text>
                    <Text style={styles.statLabel}>Products</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>2.5K</Text>
                    <Text style={styles.statLabel}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{posts_length || 0}</Text>
                    <Text style={styles.statLabel}>Tags</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' }}>Tagged Posts</Text>
        </View>
    );
}

export function BrandDetails() {
    const route = useRoute<BrandDetailsRouteProp>();
    const { brandId, brandName } = route.params;
    const navigation = useNavigation();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch
    } = usePostsWithBrandFeed(brandId);


    // Flatten posts from all pages
    const allPosts = data?.pages?.flat() || [];
    console.log('[BrandDetails] All posts:', allPosts.length);

    // Render each post
    const renderItem = useCallback(({ item }: { item: Post }) => {
        return (
            <PostCard post={item} />
        )
    }, [navigation]);

    return (
        <PaginatedGridList
            data={allPosts}
            header={<Header brandName={brandName} posts_length={allPosts.length} />}
            renderItem={renderItem}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isLoading={isLoading}
            isError={isError}
            refetch={refetch}
            keyExtractor={(item: Post) => item.uuid}
            numColumns={2}
            estimatedItemSize={250}
            loadingMoreText="Loading more posts..."
            contentContainerStyle={styles.listContent}
        />
    );
}

const styles = StyleSheet.create({
    listContent: {
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 20,
    },
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
    brandIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    brandInfo: {
        flex: 1,
    },
    brandName: {
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
        paddingVertical: 15,
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
    followButton: {
        backgroundColor: '#000',
        paddingVertical: 12,
        borderRadius: 8,
        marginVertical: 15,
    },
    followButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
    },
    tabContainer: {
        flexDirection: 'row',
        marginTop: 15,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#000',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
    },
    activeTabText: {
        color: '#000',
        fontWeight: '600',
    },
    gridItem: {
        flex: 1,
        aspectRatio: 1,
        margin: 1,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#666',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#666',
    },
}); 