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

function Header({ brandName }: { brandName: string }) {
    return (
        <View style={styles.header}>
            <View style={styles.brandInfo}>
                {/* Brand Icon */}
                <View style={styles.brandIcon}>
                    <MaterialIcons name="store" size={32} color="#666" />
                </View>

                {/* Brand Name */}
                <Text style={styles.brandName}>{brandName}</Text>
            </View>

            {/* Social Links */}
            <View style={styles.socialLinks}>
                <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => {/* TODO: Link to website */ }}
                >
                    <MaterialIcons name="language" size={24} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => {/* TODO: Link to Instagram */ }}
                >
                    <MaterialIcons name="alternate-email" size={24} color="#666" />
                </TouchableOpacity>
            </View>
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
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignContent: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    socialLinks: {
        flexDirection: 'row',
        gap: 16,
    },
    socialButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    brandIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    brandInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        width: '100%',
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