import React, { useEffect, useRef } from 'react';
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

export function GlobalFeed() {
    const navigation = useNavigation<GlobalFeedNavigationProp>();
    const { user: currentUser, username: currentUsername } = useSession();
    const onEndReachedCalledDuringMomentum = useRef(false);
    const pageLoadCount = useRef(0);

    console.log('[GlobalFeed] Component rendering');

    // Use the updated hook that supports pagination
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        isFetching,
    } = useGlobalFeed(5); // Reduced page size to 5 for easier testing

    // Debug current state
    useEffect(() => {
        console.log('[GlobalFeed] Data state changed:');
        console.log('  - isLoading:', isLoading);
        console.log('  - isFetching:', isFetching);
        console.log('  - isFetchingNextPage:', isFetchingNextPage);
        console.log('  - hasNextPage:', hasNextPage);
        console.log('  - number of pages:', data?.pages?.length || 0);
        console.log('  - total items:', data?.pages?.reduce((acc, page) => acc + page.length, 0) || 0);
    }, [data, isLoading, isFetching, isFetchingNextPage, hasNextPage]);

    const handleBrandPress = (brandId: number, brandName: string) => {
        navigation.getParent()?.navigate('Brands', {
            screen: 'BrandDetails',
            params: { brandId, brandName }
        });
    };

    const handleProfilePress = (username: string) => {
        if (username === currentUsername) {
            navigation.getParent()?.navigate('Profile', {
                screen: 'ProfileMain'
            });
        } else {
            navigation.navigate('UserProfile', { username });
        }
    };

    // Handler for when the user reaches near the end of the list
    const handleLoadMore = () => {
        console.log('[GlobalFeed] onEndReached called');
        console.log('  - hasNextPage:', hasNextPage);
        console.log('  - isFetchingNextPage:', isFetchingNextPage);
        console.log('  - onEndReachedCalledDuringMomentum:', onEndReachedCalledDuringMomentum.current);

        if (onEndReachedCalledDuringMomentum.current) {
            console.log('[GlobalFeed] Skipping load more - momentum flag is true');
            return;
        }

        if (hasNextPage && !isFetchingNextPage) {
            pageLoadCount.current += 1;
            console.log('[GlobalFeed] Fetching next page:', pageLoadCount.current);
            fetchNextPage();
            onEndReachedCalledDuringMomentum.current = true;
        } else {
            console.log('[GlobalFeed] Not fetching next page - conditions not met');
        }
    };

    // Get all posts from all pages
    const allPosts = data?.pages.flat() || [];
    console.log('[GlobalFeed] Total posts available:', allPosts.length);

    // Log post IDs for debugging
    useEffect(() => {
        if (allPosts.length > 0) {
            console.log('[GlobalFeed] First 3 posts:', allPosts.slice(0, 3).map(p => p.uuid));
            console.log('[GlobalFeed] Last 3 posts:', allPosts.slice(-3).map(p => p.uuid));
        }
    }, [allPosts.length]);

    if (isLoading) {
        console.log('[GlobalFeed] Rendering loading state');
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={styles.loadingText}>Loading posts...</Text>
                </View>
            </View>
        );
    }

    if (isError) {
        console.log('[GlobalFeed] Rendering error state');
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Error loading posts. Please try again.</Text>
            </View>
        );
    }

    if (!allPosts.length) {
        console.log('[GlobalFeed] Rendering empty state');
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>No posts yet</Text>
            </View>
        );
    }

    // Footer component to show loading indicator when fetching more posts
    const renderListFooter = () => {
        console.log('[GlobalFeed] Rendering footer - isFetchingNextPage:', isFetchingNextPage);
        if (!isFetchingNextPage) return null;

        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.footerText}>Loading more posts... ({pageLoadCount.current})</Text>
            </View>
        );
    };

    console.log('[GlobalFeed] Rendering main masonry list');

    return (
        <View style={styles.container}>
            <MasonryList
                ListHeaderComponent={
                    <>
                        <View style={styles.fixedHeader}>
                            <Text style={styles.mainTitle}>Discover Globally</Text>
                            <GlobalSearch />
                            <Text style={styles.debugText}>
                                Loaded pages: {data?.pages?.length || 0} |
                                Posts: {allPosts.length} |
                                Has more: {hasNextPage ? 'Yes' : 'No'}
                            </Text>
                        </View>
                    </>
                }
                ListFooterComponent={renderListFooter()}
                data={allPosts}
                keyExtractor={(item) => item.uuid}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.masonryContent}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                // Performance optimizations
                removeClippedSubviews={true} // Remove items outside of viewport
                onMomentumScrollBegin={() => {
                    console.log('[GlobalFeed] Momentum scroll began - resetting flag');
                    onEndReachedCalledDuringMomentum.current = false;
                }}
                renderItem={({ item, i }) => {
                    const post = item as Post;
                    // Vary image height for masonry effect
                    const imageHeight = i % 3 === 0 ? 250 : i % 2 === 0 ? 200 : 300;

                    return (
                        <View style={[
                            styles.postContainer,
                            { marginLeft: i % 2 === 0 ? 0 : 8 }
                        ]}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('PostDetails', { postId: post.uuid })}
                            >
                                <Image
                                    source={{ uri: post.image_url }}
                                    style={[styles.postImage, { height: imageHeight }]}
                                    contentFit="cover"
                                    recyclingKey={post.uuid}
                                    priority="high"
                                    transition={100}
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
                }}
            />
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
        marginBottom: 16,
        flex: 1,
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