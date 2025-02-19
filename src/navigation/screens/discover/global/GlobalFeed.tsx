import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { MasonryFlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useGlobalFeed } from '@/hooks/usePostQueries';
import { useNavigation } from '@react-navigation/native';
import { Brand } from '@/types';

const SCREEN_WIDTH = Dimensions.get('window').width;

export function GlobalFeed() {
    const onEndReachedCalledDuringMomentum = useRef(false);
    const isMounted = useRef(true);
    const [imageAspectRatios, setImageAspectRatios] = useState({});
    const navigation = useNavigation();
    // Get global feed with pagination (adjust page size as needed)
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch
    } = useGlobalFeed(8); // Use a reasonable page size

    // Flatten posts from all pages
    const allPosts = useMemo(() => {
        return data?.pages?.flat() || [];
    }, [data]);

    // Keep track of mounted state to prevent updates after unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Handle loading more posts when reaching the end
    const handleLoadMore = useCallback(() => {
        if (!isMounted.current || isFetchingNextPage || !hasNextPage) return;

        if (onEndReachedCalledDuringMomentum.current) return;

        console.log('[GlobalFeed] Loading next page of posts');
        fetchNextPage().catch(err => {
            console.error('[GlobalFeed] Error loading more posts:', err);
        });
        onEndReachedCalledDuringMomentum.current = true;
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    // Pre-calculate aspect ratios when image loads
    const onImageLoad = useCallback((postId, width, height) => {
        if (width && height && isMounted.current) {
            setImageAspectRatios(prev => ({
                ...prev,
                [postId]: width / height
            }));
        }
    }, []);

    // Render each post with dynamic height
    const renderItem = useCallback(({ item, columnIndex }) => {
        // Calculate column width (accounting for gaps and padding)
        const columnWidth = (SCREEN_WIDTH - 32) / 2; // 16px padding on each side

        // Use a default aspect ratio until the real one is measured
        // Most portrait photos are ~0.75 (3:4), landscape ~1.33 (4:3)
        const aspectRatio = imageAspectRatios[item.uuid] || 0.8;

        // Calculate height based on aspect ratio
        const itemHeight = columnWidth / aspectRatio;

        return (
            <TouchableOpacity onPress={() => {
                console.log('Pressed post:', item);
                navigation.navigate('PostDetails', { post: item });
            }}>
                <View style={styles.postContainer}>

                    <Image
                        source={{ uri: item.image_url }}
                        style={[
                            styles.postImage,
                            { height: itemHeight }
                        ]}
                        contentFit="cover"
                        transition={300}
                        recyclingKey={item.uuid}
                        onLoad={({ source: { width, height } }) => {
                            onImageLoad(item.uuid, width, height);
                        }}
                    />

                    {item.username && (
                        <Text style={styles.username}>@{item.username}</Text>
                    )}

                    {item.description && (
                        <Text numberOfLines={2} style={styles.description}>
                            {item.description}
                        </Text>
                    )}

                    {item.brands && item.brands.length > 0 && (
                        <View style={styles.brandsContainer}>
                            <Text style={styles.brandsLabel}>Brands</Text>
                            <View style={styles.brandsList}>
                                {item.brands.slice(0, 3).map((brand: Brand) => (
                                    <View key={brand.id} style={styles.brandButton}>
                                        <Text style={styles.brandText}>{brand.name}</Text>
                                    </View>
                                ))}
                                {item.brands.length > 3 && (
                                    <View style={styles.brandButton}>
                                        <Text style={styles.brandText}>+{item.brands.length - 3}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                </View>
            </TouchableOpacity>
        );
    }, [imageAspectRatios, onImageLoad]);

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

    // Handle main UI states
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.loadingText}>Loading posts...</Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                    Error loading posts. Pull down to try again.
                </Text>
            </View>
        );
    }

    if (allPosts.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No posts found.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MasonryFlashList
                data={allPosts}
                numColumns={2}
                renderItem={renderItem}
                estimatedItemSize={300}
                keyExtractor={item => item.uuid}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                onMomentumScrollBegin={() => {
                    onEndReachedCalledDuringMomentum.current = false;
                }}
                ListFooterComponent={renderFooter}
                contentContainerStyle={styles.listContent}
                optimizeItemArrangement={true}
                overrideItemLayout={(layout, item, index, maxColumns) => {
                    // Required for optimizeItemArrangement
                    // Get a rough estimate of height - will adjust when measured
                    const columnWidth = (SCREEN_WIDTH - 32) / maxColumns;
                    const aspectRatio = imageAspectRatios[item.uuid] || 0.8;
                    // Add some space for text content
                    const textContentHeight = item.description ? 80 : 40;
                    const height = columnWidth / aspectRatio + textContentHeight;

                    layout.size = height;
                    layout.span = 1; // Each item spans 1 column
                }}
                refreshing={isLoading}
                onRefresh={refetch}
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
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 20,
    },
    postContainer: {
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
        backgroundColor: '#f0f0f0',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    username: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        marginHorizontal: 10,
    },
    description: {
        fontSize: 12,
        color: '#666',
        marginHorizontal: 10,
        marginTop: 4,
        marginBottom: 6,
    },
    brandsContainer: {
        marginHorizontal: 10,
        marginBottom: 10,
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