import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    FlatList,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { Brand, Post, Style } from '@/types';
import { useBrands, useStyles, useAllStylePosts } from '@/hooks/usePostQueries';
import { CustomText } from '@/components/CustomText';
import { theme } from '@/context/ThemeContext';
import { SearchButton } from '@/components/SearchButton';

// Get screen dimensions for responsive grid
const { width } = Dimensions.get('window');
const SPACING = 4;

// Memoize the trending item component
const TrendingItem = memo(({ item, onPress }: { item: Brand, onPress: () => void }) => (
    <TouchableOpacity
        style={styles.trendingCard}
        onPress={onPress}
    >
        <CustomText style={styles.brandName}>{item.name}</CustomText>
    </TouchableOpacity>
));

// Grid image item component
const GridImage = memo(({ post, onPress, size }: { post: Post, onPress: () => void, size: { width: number, height: number } }) => (
    <TouchableOpacity
        style={[styles.gridItem, { width: size.width, height: size.height }]}
        onPress={onPress}
    >
        <Image
            source={{ uri: post.image_url }}
            style={styles.postImage}
            contentFit="cover"
        />
    </TouchableOpacity>
));

// Memoized Header Component
const Header = memo(({
    brands,
    navigation
}) => {
    const trendingBrands = useMemo(() => brands ? brands.slice(0, 10) : [], [brands]);

    const renderTrendingItem = useCallback(({ item }: { item: Brand }) => (
        <TrendingItem
            item={item}
            onPress={() => navigation.navigate('BrandDetails', {
                brandId: item.id,
                brandName: item.name,
            })}
        />
    ), [navigation]);

    return (
        <View style={styles.header}>
            <CustomText style={styles.mainTitle}>DISCOVER BRANDS</CustomText>
            <SearchButton type={'brands'} />

            <CustomText style={styles.sectionTitle}>TRENDING NOW</CustomText>
            <FlatList
                horizontal
                data={trendingBrands}
                renderItem={renderTrendingItem}
                showsHorizontalScrollIndicator={false}
                style={styles.carouselContainer}
                keyExtractor={item => item.id.toString()}
            />
        </View>
    );
});

// Style Section Component
const StyleSection = memo(({
    style,
    posts,
    navigation,
    isLoading
}: {
    style: Style,
    posts: Post[],
    navigation: any,
    isLoading: boolean
}) => {
    // Generate a layout configuration based on style id to ensure variety
    // Each style will consistently get the same layout
    const getLayoutType = useMemo(() => {
        // Use the style ID to determine a layout type (0-3)
        const layoutType = style.id % 4;
        return layoutType;
    }, [style.id]);

    // Function to check if we have enough posts for the layout
    const hasEnoughPosts = useMemo(() => {
        const layoutType = getLayoutType;
        switch (layoutType) {
            case 0: // 2 on top, 3 on bottom
                return posts.length >= 5;
            case 1: // 3 on top, 1 big on bottom
                return posts.length >= 4;
            case 2: // 1 big on top, 3 on bottom
                return posts.length >= 4;
            case 3: // Asymmetric layout (1 tall left, 2 right)
                return posts.length >= 4;
            default:
                return false;
        }
    }, [posts.length, getLayoutType]);

    // Function to render posts in different grid layouts
    const renderGrid = useCallback(() => {
        if (posts.length === 0) return null;

        const gridWidth = width - 24; // Accounting for padding
        const baseWidth = gridWidth / 2 - SPACING * 2;
        const fullWidth = gridWidth - SPACING * 2;

        // Create different grid layouts based on layoutType
        switch (getLayoutType) {
            case 0: // 2 on top, 3 on bottom (if available)
                return (
                    <View style={styles.masonry}>
                        {/* First row: 2 equal sized items */}
                        {posts.length > 0 && (
                            <GridImage
                                key={posts[0].uuid}
                                post={posts[0]}
                                size={{ width: baseWidth, height: baseWidth * 1.2 }}
                                onPress={() => navigation.navigate('PostDetails', { post: posts[0], viewType: "StandardView" })}
                            />
                        )}
                        {posts.length > 1 && (
                            <GridImage
                                key={posts[1].uuid}
                                post={posts[1]}
                                size={{ width: baseWidth, height: baseWidth * 1.2 }}
                                onPress={() => navigation.navigate('PostDetails', { post: posts[1], viewType: "StandardView" })}
                            />
                        )}

                        {/* Second row: 3 items of varying widths */}
                        {posts.length > 2 && (
                            <GridImage
                                key={posts[2].uuid}
                                post={posts[2]}
                                size={{ width: baseWidth * 0.6, height: baseWidth * 0.9 }}
                                onPress={() => navigation.navigate('PostDetails', { post: posts[2], viewType: "StandardView" })}
                            />
                        )}
                        {posts.length > 3 && (
                            <GridImage
                                key={posts[3].uuid}
                                post={posts[3]}
                                size={{ width: baseWidth * 0.6, height: baseWidth * 0.9 }}
                                onPress={() => navigation.navigate('PostDetails', { post: posts[3], viewType: "StandardView" })}
                            />
                        )}
                        {posts.length > 4 && (
                            <GridImage
                                key={posts[4].uuid}
                                post={posts[4]}
                                size={{ width: baseWidth * 0.7, height: baseWidth * 0.9 }}
                                onPress={() => navigation.navigate('PostDetails', { post: posts[4], viewType: "StandardView" })}
                            />
                        )}

                        {/* See more button */}
                        <TouchableOpacity
                            style={styles.seeMoreButton}
                            onPress={() => navigation.navigate('StylePosts', { styleId: style.id, styleName: style.name })}
                        >
                            <CustomText style={styles.seeMoreText}>Case 0 SEE MORE</CustomText>
                        </TouchableOpacity>
                    </View>
                );

            case 1: // 3 on top, 1 big on bottom
                return (
                    <View style={styles.masonry}>
                        {/* First row: 3 equal sized items */}
                        {posts.length > 0 && (
                            <GridImage
                                key={posts[0].uuid}
                                post={posts[0]}
                                size={{ width: baseWidth * 0.66, height: baseWidth * 0.9 }}
                                onPress={() => navigation.navigate('PostDetails', { post: posts[0], viewType: "StandardView" })}
                            />
                        )}
                        {posts.length > 1 && (
                            <GridImage
                                key={posts[1].uuid}
                                post={posts[1]}
                                size={{ width: baseWidth * 0.66, height: baseWidth * 0.9 }}
                                onPress={() => navigation.navigate('PostDetails', { post: posts[1], viewType: "StandardView" })}
                            />
                        )}
                        {posts.length > 2 && (
                            <GridImage
                                key={posts[2].uuid}
                                post={posts[2]}
                                size={{ width: baseWidth * 0.6, height: baseWidth * 0.9 }}
                                onPress={() => navigation.navigate('PostDetails', { post: posts[2], viewType: "StandardView" })}
                            />
                        )}

                        {/* Second row: 1 full width item */}
                        {posts.length > 3 && (
                            <GridImage
                                key={posts[3].uuid}
                                post={posts[3]}
                                size={{ width: fullWidth, height: baseWidth * 0.8 }}
                                onPress={() => navigation.navigate('PostDetails', { post: posts[3], viewType: "StandardView" })}
                            />
                        )}

                        {/* See more button */}
                        <TouchableOpacity
                            style={styles.seeMoreButton}
                            onPress={() => navigation.navigate('StylePosts', { styleId: style.id, styleName: style.name })}
                        >
                            <CustomText style={styles.seeMoreText}>Case 1 SEE MORE</CustomText>
                        </TouchableOpacity>
                    </View>
                );

            case 2: // 1 big on top, 3 on bottom
                return (
                    <View style={styles.masonry}>
                        {/* First row: 1 full width item */}
                        {posts.length > 0 && (
                            <GridImage
                                key={posts[0].uuid}
                                post={posts[0]}
                                size={{ width: fullWidth, height: baseWidth * 0.8 }}
                                onPress={() => navigation.navigate('PostDetails', { post: posts[0], viewType: "StandardView" })}
                            />
                        )}

                        {/* Second row: 3 equal sized items */}
                        {posts.length > 1 && (
                            <GridImage
                                key={posts[1].uuid}
                                post={posts[1]}
                                size={{ width: baseWidth * 0.66, height: baseWidth * 0.9 }}
                                onPress={() => navigation.navigate('PostDetails', { post: posts[1], viewType: "StandardView" })}
                            />
                        )}
                        {posts.length > 2 && (
                            <GridImage
                                key={posts[2].uuid}
                                post={posts[2]}
                                size={{ width: baseWidth * 0.66, height: baseWidth * 0.9 }}
                                onPress={() => navigation.navigate('PostDetails', { post: posts[2], viewType: "StandardView" })}
                            />
                        )}
                        {posts.length > 3 && (
                            <GridImage
                                key={posts[3].uuid}
                                post={posts[3]}
                                size={{ width: baseWidth * 0.6, height: baseWidth * 0.9 }}
                                onPress={() => navigation.navigate('PostDetails', { post: posts[3], viewType: "StandardView" })}
                            />
                        )}

                        {/* See more button */}
                        <TouchableOpacity
                            style={styles.seeMoreButton}
                            onPress={() => navigation.navigate('StylePosts', { styleId: style.id, styleName: style.name })}
                        >
                            <CustomText style={styles.seeMoreText}>Case 2 SEE MORE</CustomText>
                        </TouchableOpacity>
                    </View>
                );

            case 3: // Asymmetric layout (1 tall left, 2 right)
                return (
                    <View style={styles.masonry}>
                        {/* Left column: 1 tall item */}
                        {posts.length > 0 && (
                            <GridImage
                                key={posts[0].uuid}
                                post={posts[0]}
                                size={{ width: baseWidth * 0.9, height: baseWidth * 2.1 }}
                                onPress={() => navigation.navigate('PostDetails', { post: posts[0], viewType: "StandardView" })}
                            />
                        )}

                        {/* Right column: 2 items stacked */}
                        <View style={{ flexDirection: 'column' }}>
                            {posts.length > 1 && (
                                <GridImage
                                    key={posts[1].uuid}
                                    post={posts[1]}
                                    size={{ width: baseWidth * 1.1, height: baseWidth }}
                                    onPress={() => navigation.navigate('PostDetails', { post: posts[1], viewType: "StandardView" })}
                                />
                            )}
                            {posts.length > 2 && (
                                <GridImage
                                    key={posts[2].uuid}
                                    post={posts[2]}
                                    size={{ width: baseWidth * 1.1, height: baseWidth }}
                                    onPress={() => navigation.navigate('PostDetails', { post: posts[2], viewType: "StandardView" })}
                                />
                            )}
                        </View>

                        {/* Bottom row */}
                        {posts.length > 3 && (
                            <GridImage
                                key={posts[3].uuid}
                                post={posts[3]}
                                size={{ width: fullWidth, height: baseWidth * 0.7 }}
                                onPress={() => navigation.navigate('PostDetails', { post: posts[3], viewType: "StandardView" })}
                            />
                        )}

                        {/* See more button */}
                        <TouchableOpacity
                            style={styles.seeMoreButton}
                            onPress={() => navigation.navigate('StylePosts', { styleId: style.id, styleName: style.name })}
                        >
                            <CustomText style={styles.seeMoreText}>Case 3 SEE MORE</CustomText>
                        </TouchableOpacity>
                    </View>
                );

            default:
                return null;
        }
    }, [posts, navigation, style.id, style.name, getLayoutType]);

    // Don't render if we don't have enough posts
    if (!hasEnoughPosts) return null;

    return (
        <View style={styles.styleSection}>
            <CustomText style={styles.styleTitle}>{style.name.toUpperCase()}</CustomText>
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <CustomText style={styles.loadingText}>Loading posts...</CustomText>
                </View>
            ) : posts.length > 0 ? (
                renderGrid()
            ) : (
                <View style={styles.emptyContainer}>
                    <CustomText style={styles.emptyText}>No posts for this style yet.</CustomText>
                </View>
            )}
        </View>
    );
});

export function DiscoverScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute();

    // Get all styles and brands
    const { data: brands } = useBrands();
    const { data: stylesData, isLoading: stylesLoading } = useStyles();

    // Fetch ALL posts for ALL styles in a single hook call
    // This prevents the Rules of Hooks error
    const { data: allStylePosts, isLoading: postsLoading } = useAllStylePosts(5);

    const headerComponent = useMemo(() => (
        <Header
            brands={brands || []}
            navigation={navigation}
        />
    ), [brands, navigation]);

    return (
        <ScrollView style={styles.container}>
            {headerComponent}

            <View style={styles.stylesContainer}>
                <CustomText style={styles.stylesMainTitle}>GET INSPIRED</CustomText>

                {stylesLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#fff" />
                        <CustomText style={styles.loadingText}>Loading styles...</CustomText>
                    </View>
                ) : stylesData && stylesData.length > 0 ? (
                    stylesData.map((style) => {
                        // Get posts for this style from the allStylePosts object
                        const stylePosts = allStylePosts?.[style.id] || [];
                        const isLoadingPosts = postsLoading && !stylePosts.length;

                        return (
                            <StyleSection
                                key={style.id}
                                style={style}
                                posts={stylePosts}
                                navigation={navigation}
                                isLoading={isLoadingPosts}
                            />
                        );
                    })
                ) : (
                    <View style={styles.emptyContainer}>
                        <CustomText style={styles.emptyText}>No styles available.</CustomText>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        paddingTop: 15,
        paddingHorizontal: 12,
    },
    stylesMainTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        fontFamily: 'BebasNnue-Regular',
        color: '#fff',
        alignSelf: 'center'
    },
    mainTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: 'center',
        fontFamily: 'BebasNnue-Regular',
        color: '#fff',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        fontFamily: 'BebasNnue-Regular',
        color: '#fff',
    },
    carouselContainer: {
        marginTop: 10,
        marginBottom: 25,
    },
    trendingCard: {
        backgroundColor: theme.colors.primary,
        padding: 10,
        paddingTop: 5,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
    },
    brandName: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 5,
        color: '#fff',
    },
    stylesContainer: {
        paddingHorizontal: 12,
    },
    styleSection: {
        marginBottom: 36,
    },
    styleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#fff',
    },
    masonry: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        position: 'relative',
    },
    gridItem: {
        margin: SPACING,
        overflow: 'hidden',
        borderRadius: 4,
    },
    postImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#333',
    },
    seeMoreButton: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 8,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    seeMoreText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    loadingContainer: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#888',
        fontSize: 16,
    },
    emptyContainer: {
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
    },
    emptyText: {
        color: '#888',
        fontSize: 14,
    },
});