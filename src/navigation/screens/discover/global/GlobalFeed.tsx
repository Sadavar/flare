import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useGlobalFeed } from '@/hooks/usePostQueries';
import { useNavigation } from '@react-navigation/native';
import { Post } from '@/types';

export function GlobalFeed() {
    const onEndReachedCalledDuringMomentum = useRef(false);
    const navigation = useNavigation();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch
    } = useGlobalFeed(10);

    // Flatten posts from all pages
    const allPosts = data?.pages?.flat() || [];

    // Handle refresh
    const handleRefresh = useCallback(() => {
        refetch({ refetchPage: (_data, index) => index === 0 });
    }, [refetch]);

    // Handle loading more posts
    const handleLoadMore = useCallback(() => {
        if (isFetchingNextPage || !hasNextPage) return;
        if (onEndReachedCalledDuringMomentum.current) return;

        fetchNextPage().catch(err => {
            console.error('[GlobalFeed] Error loading more posts:', err);
        });
        onEndReachedCalledDuringMomentum.current = true;
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    // Render each post
    const renderItem = useCallback(({ item }: { item: Post }) => {
        return (
            <View>
                <TouchableOpacity
                    style={styles.postContainer}
                    onPress={() => navigation.navigate('PostDetails', { post: item })}
                >
                    <Image
                        source={{ uri: item.image_url }}
                        style={styles.postImage}
                        contentFit="cover"
                        transition={300}
                    />
                </TouchableOpacity>


                {item.brands && item.brands.length > 0 && (
                    <View style={styles.brandsContainer}>
                        <Text style={styles.brandsLabel}>Brands</Text>
                        <View style={styles.brandsList}>
                            {item.brands.slice(0, 2).map((brand) => (
                                <TouchableOpacity
                                    key={brand.id}
                                    style={styles.brandButton}
                                    onPress={() => navigation.navigate('Brands', {
                                        screen: 'BrandDetails',
                                        params: { brandId: brand.id, brandName: brand.name }
                                    })}
                                >
                                    <Text style={styles.brandText}>{brand.name}</Text>
                                </TouchableOpacity>
                            ))}
                            {item.brands.length > 2 && (
                                <View style={styles.brandButton}>
                                    <Text style={styles.brandText}>+{item.brands.length - 2}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </View>
        )
    }, [navigation]);

    // Render loading indicator at bottom during pagination
    const renderFooter = useCallback(() => {
        if (!isFetchingNextPage) return null;

        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.footerText}>Loading more posts...</Text>
            </View>
        );
    }, [isFetchingNextPage]);

    // Handle loading state
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.loadingText}>Loading posts...</Text>
            </View>
        );
    }

    // Handle error state
    if (isError) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                    Error loading posts. Pull down to try again.
                </Text>
            </View>
        );
    }

    // Handle empty state
    if (allPosts.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No posts found.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlashList
                data={allPosts}
                numColumns={2}
                renderItem={renderItem}
                estimatedItemSize={250}
                keyExtractor={(item) => item.uuid}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                onMomentumScrollBegin={() => {
                    onEndReachedCalledDuringMomentum.current = false;
                }}
                ListFooterComponent={renderFooter}
                contentContainerStyle={styles.listContent}
                refreshing={isLoading}
                onRefresh={handleRefresh}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    listContent: {
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 20,
    },
    postContainer: {
        flex: 1,
        margin: 6,
        borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        overflow: 'hidden',
    },
    postImage: {
        width: '100%',
        aspectRatio: 0.75, // 3:4 aspect ratio (width:height)
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
    },
    brandsContainer: {
        margin: 10,
    },
    brandsLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: '#888',
        marginBottom: 4,
    },
    brandsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    brandButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#f5f5f5',
        borderRadius: 6,
    },
    brandText: {
        fontSize: 10,
        color: '#555',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#e53935',
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    footerLoader: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },
});