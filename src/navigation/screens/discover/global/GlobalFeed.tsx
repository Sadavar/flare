import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import FastImage from 'react-native-fast-image';
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

const PostCard = ({ post, style }: { post: Post, style: any }) => {
    const cardHeight = useRef(Math.random() < 0.5 ? 150 : 280).current;
    const navigation = useNavigation<GlobalFeedNavigationProp>();
    // Improved error handling for navigation
    const handlePostPress = useCallback(() => {
        try {
            if (!post || !post.uuid) {
                console.error('[GlobalFeed] Invalid post data for navigation');
                return;
            }

            // Validate image URL before navigation
            if (!post.image_url) {
                console.warn('[GlobalFeed] Missing image URL for post:', post.uuid);
            }

            // Prefetch image before navigation
            if (post.image_url) {
                console.log('[GlobalFeed] Prefetching image for post:', post.uuid);
                Image.prefetch(post.image_url).catch(err =>
                    console.warn(`[GlobalFeed] Prefetch failed: ${post.uuid}`, err)
                );
            } else {
                console.warn('[GlobalFeed] Missing image URL for post:', post.uuid);
            }

            console.log('post', post);

            // Navigate with a small delay to allow prefetch to start
            setTimeout(() => {
                navigation.navigate('PostDetails', { post: post });
            }, 50);

        } catch (err) {
            console.error('[GlobalFeed] Navigation error:', err);
        }
    }, [post, navigation]);

    // Check if post has required data
    if (!post || !post.uuid || !post.image_url) {
        return (
            <View style={[{ marginTop: 12, flex: 1 }, style]}>
                <View style={{
                    height: cardHeight,
                    alignSelf: 'stretch',
                    backgroundColor: '#f0f0f0',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <Text>Image unavailable</Text>
                </View>
            </View>
        );
    }


    return (
        <View key={post.uuid} style={[{ marginTop: 12, flex: 1 }, style]}>
            <TouchableOpacity
                onPress={handlePostPress}
            >
                <Image
                    source={{ uri: post.image_url }}
                    style={{
                        height: cardHeight,
                        alignSelf: 'stretch',
                    }}
                    contentFit="cover"
                    onError={e => console.warn(`[GlobalFeed] Image load error: ${post.uuid}`, e)}
                    recyclingKey={post.uuid}
                    transition={200}
                    priority="normal"
                />
            </TouchableOpacity>
        </View>
    );
}

export function GlobalFeed() {
    const navigation = useNavigation<GlobalFeedNavigationProp>();
    const { user: currentUser, username: currentUsername } = useSession();
    const onEndReachedCalledDuringMomentum = useRef(false);
    const pageLoadCount = useRef(0);
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);


    // hook that supports pagination 
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        isFetching,
        refetch
    } = useGlobalFeed(5);

    // Debug current state - but limit logging frequency
    useEffect(() => {

        console.log('[GlobalFeed] Data state changed:');
        console.log('  - isLoading:', isLoading);
        console.log('  - isFetching:', isFetching);
        console.log('  - isFetchingNextPage:', isFetchingNextPage);
        console.log('  - hasNextPage:', hasNextPage);
        console.log('  - number of pages:', data?.pages?.length || 0);
        console.log('  - total items:', data?.pages?.flat().length || 0);
    }, [data, isLoading, isFetching, isFetchingNextPage, hasNextPage]);

    const handleRefresh = useCallback(async () => {
        if (isRefreshing) return; // Prevent multiple refreshes & check mount status

        console.log('[GlobalFeed] Pull-to-refresh triggered');
        setIsRefreshing(true);

        try {
            // Reset the query and refetch first page
            await queryClient.resetQueries({ queryKey: ['globalFeed'] });
            await refetch();

            console.log('[GlobalFeed] Refresh completed successfully');
        } catch (error) {
            console.error('[GlobalFeed] Error during refresh:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [isRefreshing, queryClient, refetch]);

    const handleBrandPress = useCallback((brandId: number, brandName: string) => {
        navigation.navigate('Brands', {
            screen: 'BrandDetails',
            params: { brandId, brandName }
        });
    }, [navigation]);

    const handleProfilePress = useCallback((username: string) => {
        if (username === currentUsername) {
            navigation.navigate('Profile', {
                screen: 'ProfileMain'
            });
        } else {
            navigation.navigate('UserProfile', { username });
        }
    }, [navigation, currentUsername]);

    // Handler for when the user reaches near the end of the list
    const handleLoadMore = useCallback(() => {
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
            pageLoadCount.current += 1;
            console.log('[GlobalFeed] Fetching next page:', pageLoadCount.current);
            fetchNextPage().catch(err => {
                console.error('[GlobalFeed] Error fetching next page:', err);
            });
            onEndReachedCalledDuringMomentum.current = true;
        }
    }, [hasNextPage, isFetchingNextPage, isFetching, fetchNextPage, data]);

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

    const renderItem = ({ item, i }: { item: Post, i: number }) => {
        return (
            <PostCard post={item} style={{ marginLeft: i % 2 === 0 ? 0 : 12 }} />
        );
    };

    // Prepare header component with memo
    const ListHeaderComponent = useMemo(() => (
        <View style={styles.fixedHeader}>
            <Text style={styles.mainTitle}>Discover Globally</Text>
            <GlobalSearch />
            <Text style={styles.debugText}>
                Loaded pages: {data?.pages?.length || 0} |
                Posts: {data?.pages?.flat().length} |
                Has more: {hasNextPage ? 'Yes' : 'No'}
            </Text>
        </View>
    ), [data?.pages?.length, data?.pages?.flat().length, hasNextPage]);

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
    } else if (!data?.pages?.flat().length) {
        console.log('[GlobalFeed] Rendering empty state');
        content = (
            <Text style={styles.emptyText}>No posts yet</Text>
        );
    } else {
        console.log('[GlobalFeed] Rendering masonry list with', data?.pages?.flat().length, 'posts');
        content = (
            <MasonryList
                ListHeaderComponent={ListHeaderComponent}
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                ListFooterComponent={renderListFooter()}
                data={data?.pages?.flat() || []}
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