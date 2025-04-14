import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { BrandsStackParamList } from '@/types';
import { Layout } from '@/components/Layout';
import { useNavigation } from '@react-navigation/native';
import { Post } from '@/types'
import { PaginatedGridList } from '@/components/PaginatedGridList';
import PostCard from '@/components/PostCard';
import { usePostsWithBrandFeed } from '@/hooks/usePostQueries';
import { CustomText } from '@/components/CustomText';
import { theme } from '@/context/ThemeContext';

type BrandDetailsRouteProp = RouteProp<BrandsStackParamList, 'BrandDetails'>;

// Fetch brand details including website and social URLs
const useBrandDetails = (brandId) => {
    return useQuery({
        queryKey: ['brandDetails', brandId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('brands')
                .select('*')
                .eq('id', brandId)
                .single();

            if (error) throw error;
            return data;
        }
    });
};

function Header({ brandName, postsLength, websiteUrl, instagramUrl }) {
    const handleOpenLink = (url) => {
        if (url) {
            Linking.openURL(url);
        }
    };

    return (
        <View style={styles.header}>
            {/* Profile Section */}
            <View style={styles.profileSection}>
                {/* Brand Icon */}
                <View style={styles.brandIcon}>
                    <MaterialIcons name="store" size={32} color="#666" />
                </View>

                {/* Brand Name and Post Count */}
                <View style={styles.brandNameContainer}>
                    <CustomText style={styles.brandName}>{brandName}</CustomText>
                    <CustomText style={styles.postCount}>{postsLength} tagged posts</CustomText>
                </View>
            </View>

            {/* Website Link */}
            <TouchableOpacity
                style={styles.linkButton}
                onPress={() => handleOpenLink(websiteUrl)}
            >
                <MaterialIcons name="language" size={24} color={theme.colors.primary} />
                {websiteUrl ? (
                    <CustomText style={styles.linkText}>Link to Website</CustomText>
                ) : (
                    <CustomText style={styles.linkText}>No Website Link Yet</CustomText>
                )}
            </TouchableOpacity>

            {/* Social Links Row */}
            <View style={styles.socialLinksRow}>
                {/* Social Icon */}
                <View style={styles.socialIconContainer}>
                    <MaterialIcons name="alternate-email" size={24} color={theme.colors.primary} />
                </View>

                {/* Social Text */}
                {instagramUrl ? (
                    <TouchableOpacity
                        style={styles.socialLinksText}
                        onPress={() => handleOpenLink(instagramUrl)}
                    >
                        <CustomText style={styles.linkText}>Link to Instagram</CustomText>
                    </TouchableOpacity>
                ) : (
                    <CustomText style={styles.linkText}>No Instagram Link Yet</CustomText>
                )}
            </View>

            {/* Favorite Button */}
            <TouchableOpacity style={styles.favoriteButton}>
                <CustomText style={styles.favoriteButtonText}>Favorite</CustomText>
            </TouchableOpacity>

            {/* Tagged Posts Title */}
            <View style={styles.taggedPostsHeader}>
                <CustomText style={styles.taggedPostsTitle}>Tagged Posts</CustomText>
            </View>
        </View>
    );
}

export function BrandDetails() {
    const route = useRoute<BrandDetailsRouteProp>();
    const { brandId, brandName } = route.params;
    const navigation = useNavigation();

    // Fetch brand details
    const { data: brandDetails, isLoading: isLoadingBrandDetails } = useBrandDetails(brandId);

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
            header={
                <Header
                    brandName={brandName}
                    postsLength={allPosts.length}
                    websiteUrl={brandDetails?.website_url}
                    instagramUrl={brandDetails?.instagram_url}
                />
            }
            renderItem={renderItem}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isLoading={isLoading || isLoadingBrandDetails}
            isError={isError}
            refetch={refetch}
            keyExtractor={(item: Post) => item.uuid}
            numColumns={2}
            estimatedItemSize={250}
            loadingMoreText="Loading more posts..."
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <CustomText style={styles.emptyText}>No posts found for this brand.</CustomText>
                </View>
            }
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
        padding: 16,
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
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    brandNameContainer: {
        flex: 1,
    },
    brandName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    postCount: {
        fontSize: 16,
        color: '#666',
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    linkText: {
        fontSize: 16,
        marginLeft: 8,
    },
    socialLinksRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    socialLinksText: {
        flex: 1,
    },
    favoriteButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 10,
        alignItems: 'center',
        marginBottom: 16,
        borderRadius: 12,
    },
    favoriteButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    taggedPostsHeader: {
        marginTop: 8,
        marginBottom: 8,
    },
    taggedPostsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyContainer: {
        backgroundColor: 'red',
        color: 'red'

    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#666',
    },
});