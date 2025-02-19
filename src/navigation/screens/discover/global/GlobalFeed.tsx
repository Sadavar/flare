import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { GlobalStackParamList } from '@/types';
import { useSession } from '@/context/SessionContext';
import MasonryList from '@react-native-seoul/masonry-list';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Post } from '@/types'
import { useGlobalFeed } from '@/hooks/usePostQueries';
import { useQueryClient } from '@tanstack/react-query';

type GlobalFeedNavigationProp = NativeStackNavigationProp<GlobalStackParamList, 'GlobalFeed'>;

function GlobalSearch() {
    const styles = StyleSheet.create({
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 0.5,
            borderColor: '#000',
            borderRadius: 20,
            paddingHorizontal: 10,
            margin: 15,
        },
        searchIcon: {
            marginRight: 10,
        },
        searchInput: {
            flex: 1,
            height: 40,
        },
    });

    return (
        <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={30} color="#000" style={styles.searchIcon} />
            <TextInput
                style={styles.searchInput}
                placeholder="Search for brands"
                placeholderTextColor="#666"
                // value={searchQuery}
                // onChangeText={setSearchQuery}
                autoCorrect={false}
            />
        </View>
    );
}

/**
 * Assigns new items to columns while maintaining existing assignments
 * @param items Array of items to distribute
 * @param getItemHeight Function to estimate item height
 * @param getItemId Function to get unique ID for each item
 * @param numColumns Number of columns (default: 2)
 * @param currentState Current masonry state reference
 */
function balanceMasonryData<T>(
    items: T[],
    getItemHeight: (item: T, index: number) => number,
    getItemId: (item: T) => string,
    numColumns: number = 2,
    currentState: React.MutableRefObject<{
        columnHeights: number[],
        itemToColumnMap: Map<string, number>
    }>
): T[] {
    if (items.length === 0) return items;

    // Reset column heights if no items are assigned yet
    // (happens on first load or when clearing data)
    if (currentState.current.itemToColumnMap.size === 0) {
        currentState.current.columnHeights = Array(numColumns).fill(0);
    }

    // Get current column heights
    const columnHeights = [...currentState.current.columnHeights];

    // Create virtual columns for distribution
    const columns: T[][] = Array(numColumns).fill(null).map(() => []);

    // Step 1: Process previously assigned items first
    const previouslyAssignedItems: T[] = [];
    const newItems: T[] = [];

    items.forEach(item => {
        const itemId = getItemId(item);
        if (currentState.current.itemToColumnMap.has(itemId)) {
            previouslyAssignedItems.push(item);
        } else {
            newItems.push(item);
        }
    });

    // Place previously assigned items in their original columns
    previouslyAssignedItems.forEach(item => {
        const itemId = getItemId(item);
        const columnIndex = currentState.current.itemToColumnMap.get(itemId)!;
        columns[columnIndex].push(item);
        // Don't update heights yet - we'll do that after all assignments
    });

    // Step 2: Sort new items by height (tallest first)
    const sortedNewItems = [...newItems].sort((a, b) => {
        const heightA = getItemHeight(a, items.indexOf(a));
        const heightB = getItemHeight(b, items.indexOf(b));
        return heightB - heightA; // Tallest first
    });

    // Step 3: Assign new items to the shortest column
    sortedNewItems.forEach(item => {
        // Find shortest column
        const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));

        // Assign item to shortest column
        columns[shortestColumnIndex].push(item);

        // Update column height
        columnHeights[shortestColumnIndex] += getItemHeight(item, items.indexOf(item));

        // Store assignment for future renders
        currentState.current.itemToColumnMap.set(getItemId(item), shortestColumnIndex);
    });

    // Update stored column heights for next pagination
    currentState.current.columnHeights = columnHeights;

    // Step 4: Create final array by taking items column by column
    // This works because MasonryList fills columns in order:
    // [0, 2, 4, ...] for first column, [1, 3, 5, ...] for second column
    const result: T[] = [];
    const maxItems = Math.max(...columns.map(col => col.length));

    for (let i = 0; i < maxItems; i++) {
        for (let col = 0; col < numColumns; col++) {
            if (i < columns[col].length) {
                result.push(columns[col][i]);
            }
        }
    }

    return result;
}

export function GlobalFeed() {
    const navigation = useNavigation<GlobalFeedNavigationProp>();
    const { user: currentUser, username: currentUsername } = useSession();
    const onEndReachedCalledDuringMomentum = useRef(false);
    const pageLoadCount = useRef(0);
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Properly scoped masonryState using useRef
    const masonryState = useRef({
        columnHeights: [0, 0] as number[], // For 2 columns
        itemToColumnMap: new Map<string, number>() // Maps item IDs to column assignments
    });

    // Add navigation focus listener to manage memory
    const isFocused = useRef(true);
    const isMounted = useRef(true);

    // Cleanup helper function to avoid duplication
    const cleanupResources = useCallback(() => {
        try {
            if (!isMounted.current) return;

            console.log('[GlobalFeed] Cleaning up resources');
            // Clear masonry state on ANY cleanup (navigation or tab change)
            masonryState.current.columnHeights = [0, 0];
            masonryState.current.itemToColumnMap.clear();
            pageLoadCount.current = 0;

            // Clear excess query cache to free memory 
            if (data?.pages?.length > 1) {
                queryClient.setQueryData(['globalFeed'], (oldData: any) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.slice(0, 1),
                        pageParams: oldData.pageParams.slice(0, 1)
                    };
                });
            }
        } catch (error) {
            console.error('[GlobalFeed] Error during cleanup:', error);
        }
    }, [queryClient, data?.pages?.length]);

    useEffect(() => {
        isMounted.current = true;

        const unsubscribeFocus = navigation.addListener('focus', () => {
            console.log('[GlobalFeed] Screen focused');
            isFocused.current = true;
        });

        const unsubscribeBlur = navigation.addListener('blur', () => {
            console.log('[GlobalFeed] Screen blurred');
            isFocused.current = false;

            // Opportunity to clean up resources when navigating away
            if (data?.pages?.length > 2) {
                console.log('[GlobalFeed] Cleaning up excess pages on blur');
                // Keep only first 2 pages to reduce memory pressure
                queryClient.setQueryData(['globalFeed'], (oldData: any) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        pages: oldData.pages.slice(0, 2),
                        pageParams: oldData.pageParams.slice(0, 2)
                    };
                });
            }
        });

        return () => {
            isMounted.current = false;
            isFocused.current = false;
            console.log('[GlobalFeed] Component unmounting - cleaning up');

            cleanupResources();

            unsubscribeFocus();
            unsubscribeBlur();
        };
    }, [navigation, cleanupResources]);

    // Use the updated hook that supports pagination with smaller page size
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        isFetching,
        refetch
    } = useGlobalFeed(4); // Reduced page size to reduce memory pressure

    // Get all posts from all pages - do this even during loading for consistent hook calls
    const allPosts = data?.pages?.flat() || [];

    // Apply memo to expensive calculations
    const getPostHeight = useCallback((post: Post, index: number) => {
        return index % 3 === 0 ? 250 : index % 2 === 0 ? 200 : 300;
    }, []);

    const getPostId = useCallback((post: Post) => post.uuid, []);

    // Memoize balanced posts calculation to prevent unnecessary recalculations
    const balancedPosts = useMemo(() => {
        if (allPosts.length === 0) return [];
        return balanceMasonryData(allPosts, getPostHeight, getPostId, 2, masonryState);
    }, [allPosts, getPostHeight, getPostId]);

    // Debug current state - but limit logging frequency
    useEffect(() => {
        if (!isFocused.current) return;

        console.log('[GlobalFeed] Data state changed:');
        console.log('  - isLoading:', isLoading);
        console.log('  - isFetching:', isFetching);
        console.log('  - isFetchingNextPage:', isFetchingNextPage);
        console.log('  - hasNextPage:', hasNextPage);
        console.log('  - number of pages:', data?.pages?.length || 0);
        console.log('  - total items:', allPosts.length);
    }, [data, isLoading, isFetching, isFetchingNextPage, hasNextPage, allPosts.length]);

    const handleRefresh = useCallback(async () => {
        if (isRefreshing || !isMounted.current) return; // Prevent multiple refreshes & check mount status

        console.log('[GlobalFeed] Pull-to-refresh triggered');
        setIsRefreshing(true);

        try {
            // Reset masonry state first
            masonryState.current.columnHeights = [0, 0];
            masonryState.current.itemToColumnMap.clear();
            pageLoadCount.current = 0;

            // Reset the query and refetch first page
            await queryClient.resetQueries({ queryKey: ['globalFeed'] });
            await refetch();

            console.log('[GlobalFeed] Refresh completed successfully');
        } catch (error) {
            console.error('[GlobalFeed] Error during refresh:', error);
        } finally {
            if (isMounted.current) {
                setIsRefreshing(false);
            }
        }
    }, [isRefreshing, queryClient, refetch]);

    const handleBrandPress = useCallback((brandId: number, brandName: string) => {
        if (!isFocused.current || !isMounted.current) return;
        safeNavigate('Brands', {
            screen: 'BrandDetails',
            params: { brandId, brandName }
        });
    }, [navigation]);

    const handleProfilePress = useCallback((username: string) => {
        if (!isFocused.current || !isMounted.current) return;
        if (username === currentUsername) {
            safeNavigate('Profile', {
                screen: 'ProfileMain'
            });
        } else {
            safeNavigate('UserProfile', { username });
        }
    }, [navigation, currentUsername]);

    // Handler for when the user reaches near the end of the list
    const handleLoadMore = useCallback(() => {
        if (!isFocused.current || isFetching || !isMounted.current) return;

        console.log('[GlobalFeed] onEndReached called');
        console.log('  - hasNextPage:', hasNextPage);
        console.log('  - isFetchingNextPage:', isFetchingNextPage);

        if (onEndReachedCalledDuringMomentum.current) {
            return;
        }

        if (hasNextPage && !isFetchingNextPage) {
            if (data === undefined) {
                console.log('[GlobalFeed] No data found, not loading more');
                return;
            }

            // Add maximum page limit for memory management
            // const MAX_PAGES = 5;
            // if (data.pages && data.pages.length >= MAX_PAGES) {
            //     console.log(`[GlobalFeed] Reached maximum page limit (${MAX_PAGES})`);
            //     return;
            // }

            pageLoadCount.current += 1;
            console.log('[GlobalFeed] Fetching next page:', pageLoadCount.current);
            fetchNextPage().catch(err => {
                console.error('[GlobalFeed] Error fetching next page:', err);
            });
            onEndReachedCalledDuringMomentum.current = true;
        }
    }, [hasNextPage, isFetchingNextPage, isFetching, fetchNextPage, data]);

    // Debug column assignments if needed - limit to focused state
    useEffect(() => {
        if (!isFocused.current || allPosts.length === 0) return;

        console.log('[GlobalFeed] Column distribution stats:');
        console.log('  - Left column items:', masonryState.current.columnHeights[0]);
        console.log('  - Right column items:', masonryState.current.columnHeights[1]);
        console.log('  - Total tracked items:', masonryState.current.itemToColumnMap.size);
    }, [balancedPosts.length, allPosts.length]);

    // Memoize rendering functions to prevent unnecessary rerenders
    const renderListFooter = useCallback(() => {
        if (!isFetchingNextPage) return null;

        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.footerText}>Loading more posts... ({pageLoadCount.current})</Text>
            </View>
        );
    }, [isFetchingNextPage]);

    // Safe navigation handler - prevents navigation after unmount
    const safeNavigate = useCallback((routeName, params) => {
        if (isMounted.current && isFocused.current) {
            navigation.navigate(routeName, params);
        } else {
            console.log('[GlobalFeed] Prevented navigation after unmount');
        }
    }, [navigation]);

    const renderItem = useCallback(({ item, i }: { item: Post, i: number }) => {
        if (!isMounted.current) return null;

        const post = item;

        // Determine which column this item is in (for consistent heights)
        const column = i % 2;
        // Get persistent height based on the column number and the post's ID
        const postIdNum = parseInt(post.uuid.slice(-6), 16) || 0;
        const imageHeight = column === 0
            ? (postIdNum % 2 === 0 ? 250 : 200)
            : (postIdNum % 2 === 0 ? 200 : 300);

        return (
            <View style={[
                styles.postContainer,
                { marginLeft: i % 2 === 0 ? 0 : 8 }
            ]}>
                <TouchableOpacity
                    onPress={() => {
                        // Use safe navigation instead of direct navigation
                        if (isMounted.current && isFocused.current) {
                            // Prepare for navigation by reducing memory pressure
                            if (data?.pages?.length > 2) {
                                try {
                                    queryClient.setQueryData(['globalFeed'], (oldData: any) => {
                                        if (!oldData) return oldData;
                                        return {
                                            ...oldData,
                                            pages: oldData.pages.slice(0, 2),
                                            pageParams: oldData.pageParams.slice(0, 2)
                                        };
                                    });
                                } catch (error) {
                                    console.error('[GlobalFeed] Error trimming pages:', error);
                                }
                            }
                            safeNavigate('PostDetails', { postId: post.uuid });
                        }
                    }}
                >
                    <Image
                        source={{ uri: post.image_url }}
                        style={[styles.postImage, { height: imageHeight }]}
                        contentFit="cover"
                        recyclingKey={post.uuid}
                        priority={i < 8 ? "high" : "normal"} // High priority only for visible items
                        transition={100}
                        cachePolicy="memory-disk" // Add cache policy
                        onError={e => console.warn(`[GlobalFeed] Image load error: ${post.uuid}`, e)}
                    />
                    <Text style={styles.postIdText}>#{i + 1} - {post.uuid.slice(-4)}</Text>
                </TouchableOpacity>

                {post.brands && post.brands.length > 0 && (
                    <View style={styles.brandsContainer}>
                        <Text style={styles.brandsLabel}>Featured Brands:</Text>
                        <View style={styles.brandsList}>
                            {post.brands?.map((brand) => (
                                <TouchableOpacity
                                    key={brand.id}
                                    style={styles.brandButton}
                                    onPress={() => handleBrandPress(brand.id, brand.name)}
                                >
                                    <Text style={styles.brandText}>{brand.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        );
    }, [data?.pages?.length, queryClient, safeNavigate, handleBrandPress]);

    // Prepare header component with memo
    const ListHeaderComponent = useMemo(() => (
        <View style={styles.fixedHeader}>
            <Text style={styles.mainTitle}>Discover Globally</Text>
            <GlobalSearch />
            <Text style={styles.debugText}>
                Loaded pages: {data?.pages?.length || 0} |
                Posts: {allPosts.length} |
                Has more: {hasNextPage ? 'Yes' : 'No'}
            </Text>
        </View>
    ), [data?.pages?.length, allPosts.length, hasNextPage]);

    // Prepare content based on state
    let content;
    if (isLoading) {
        console.log('[GlobalFeed] Rendering loading state');
        content = (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.loadingText}>Loading posts...</Text>
            </View>
        );
    } else if (isError) {
        console.log('[GlobalFeed] Rendering error state');
        content = (
            <Text style={styles.errorText}>Error loading posts. Please try again.</Text>
        );
    } else if (!allPosts.length) {
        console.log('[GlobalFeed] Rendering empty state');
        content = (
            <Text style={styles.emptyText}>No posts yet</Text>
        );
    } else {
        console.log('[GlobalFeed] Rendering masonry list with', balancedPosts.length, 'posts');
        content = (
            <MasonryList
                ListHeaderComponent={ListHeaderComponent}
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                ListFooterComponent={renderListFooter()}
                data={balancedPosts}
                keyExtractor={(item) => item.uuid}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.masonryContent}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                // Performance optimizations
                removeClippedSubviews={true}
                onMomentumScrollBegin={() => {
                    onEndReachedCalledDuringMomentum.current = false;
                }}
                renderItem={renderItem as any}
                maxToRenderPerBatch={8} // Limit batch size
                windowSize={5} // Reduce window size
                updateCellsBatchingPeriod={50} // Increase batching period
                initialNumToRender={8} // Limit initial render count
            />
        );
    }

    // Always return the same component structure
    return (
        <View style={styles.container}>
            {content}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        marginTop: 0
    },
    fixedHeader: {
        paddingTop: 10,
        backgroundColor: '#fff',
        zIndex: 1,
    },
    mainTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: 'center',
    },
    masonryContent: {
        paddingHorizontal: 12,
    },
    postContainer: {
        // marginBottom: 16,
        // flex: 1,

        marginBottom: 16,
        // Each post is 50% of container width minus gap
        width: '100%',
        paddingHorizontal: 4, // Half of your desired gap (8px)
    },
    username: {
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    postImage: {
        width: '100%',
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
    },
    postIdText: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: 4,
        borderRadius: 4,
        fontSize: 10,
    },
    description: {
        marginTop: 8,
        color: '#666',
        fontSize: 14,
    },
    brandsContainer: {
        marginTop: 8,
    },
    brandsLabel: {
        fontWeight: '600',
        color: '#333',
        fontSize: 12,
        marginBottom: 4,
    },
    brandsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    brandButton: {
        backgroundColor: '#e0e0e0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    brandText: {
        fontSize: 12,
        color: '#444',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    footerLoader: {
        padding: 20,
        alignItems: 'center',
    },
    footerText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },
    errorText: {
        textAlign: 'center',
        marginTop: 100,
        fontSize: 16,
        color: '#e74c3c',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 100,
        fontSize: 16,
        color: '#666',
    },
    debugText: {
        textAlign: 'center',
        fontSize: 10,
        color: '#999',
        marginTop: 5,
        marginBottom: 5,
    },
});