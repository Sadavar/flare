import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/context/SessionContext';
import { useNavigation } from '@react-navigation/native';
import type { Post } from '@/types';
import { useUserPosts } from '@/hooks/usePostQueries';
import { Username } from '@/navigation/screens/auth/Username';
import { usePost } from '@/hooks/usePostQueries'
import { getColors } from 'react-native-image-colors';
import { SessionContext } from '@/context/SessionContext';

// Get screen width
const SCREEN_WIDTH = Dimensions.get('window').width;

interface PostViewProps {
    postId: string;
}

// Update the type for the API response
type ColorApiResponse = {
    colors: string[];
};

export function PostView({ postId }: PostViewProps) {
    const { username: currentUsername } = useSession();
    const navigation = useNavigation();
    const [showTags, setShowTags] = useState(true);
    const [imageColors, setImageColors] = useState<ColorApiResponse | null>(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [imageHeight, setImageHeight] = useState(undefined);
    const loadingStartTimeRef = useRef(Date.now());

    // At the top of the component
    const isMounted = useRef(true);
    const pendingRequests = useRef([]);

    // Pre-fetch and cache dimensions before rendering
    const { data: post, isLoading } = usePost(postId);

    // Add to useEffect for lifecycle management
    useEffect(() => {
        isMounted.current = true;
        loadingStartTimeRef.current = Date.now();

        return () => {
            isMounted.current = false;

            // Cancel any pending color extraction requests
            pendingRequests.current.forEach((controller: AbortController) => {
                controller.abort();
            });
            pendingRequests.current = [];
        };
    }, []);

    // Update handleOnLoad to check mounted state
    const handleOnLoad = useCallback((event) => {
        if (!isMounted.current) return;

        const loadTime = Date.now() - loadingStartTimeRef.current;
        console.log(`Image loaded in ${loadTime}ms`);

        // Calculate actual height based on natural image dimensions
        if (event?.source && isMounted.current) {
            const { width, height } = event.source;
            const aspectRatio = width / height;
            const calculatedHeight = SCREEN_WIDTH / aspectRatio;
            setImageHeight(calculatedHeight);
        }

        if (isMounted.current) {
            setIsImageLoaded(true);

            // Only fetch colors if component is still mounted
            if (post?.image_url && isMounted.current) {
                fetchColors(post.image_url);
            }
        }
    }, [post?.image_url]);

    // Update fetchColors to be cancelable and check mounted state
    const fetchColors = async (imageUrl) => {
        if (!isMounted.current) return;

        const controller = new AbortController();
        pendingRequests.current.push(controller);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(
                'https://yhnamwhotpnhgcicqpmd.supabase.co/functions/v1/extractColors',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`
                    },
                    body: JSON.stringify({ image_url: imageUrl }),
                    signal: controller.signal
                }
            );

            if (!isMounted.current) return;

            const data = await response.json();
            setImageColors(data);
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error getting colors:', err);
            }
        } finally {
            // Remove this controller from pending requests
            pendingRequests.current = pendingRequests.current.filter(c => c !== controller);
        }
    };

    const handleImageError = useCallback((error) => {
        console.error('Error loading image:', error);
        // Set a default aspect ratio on error
        setImageHeight(SCREEN_WIDTH);
        setIsImageLoaded(true);
    }, []);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!post) {
        return (
            <View style={styles.container}>
                <Text>Post not found</Text>
            </View>
        );
    }

    const handleUserPress = (username: string) => {
        if (username === currentUsername) {
            navigation.getParent()?.navigate('Profile', { screen: 'ProfileMain' });
        } else {
            navigation.navigate('Global', {
                screen: 'UserProfile',
                params: { username },
            });
        }
    };

    const handleBrandPress = (brandId: number, brandName: string) => {
        navigation.navigate('Brands', {
            screen: 'BrandDetails',
            params: { brandId, brandName },
        });
    };

    const toggleTagsVisibility = () => {
        setShowTags((prevState) => !prevState);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.userInfo}
                    onPress={() => handleUserPress(post.username)}
                    activeOpacity={1}
                >
                    <View style={styles.userIcon}>
                        <MaterialIcons name="person" size={24} color="black" />
                    </View>
                    <Text style={styles.username}>@{post.username}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.imageContainer}>
                {/* Hidden image for preloading that will trigger onLoad/calculate dimensions */}
                <Image
                    source={{ uri: post.image_url }}
                    style={{ width: 1, height: 1, opacity: 0, position: 'absolute' }}
                    onLoad={handleOnLoad}
                    onError={handleImageError}
                    priority="high"
                    cachePolicy="memory-disk"
                />

                {isImageLoaded && (
                    <TouchableOpacity
                        onPress={toggleTagsVisibility}
                        activeOpacity={1}
                        style={{ width: '100%' }}
                    >
                        <Image
                            source={{ uri: post.image_url }}
                            style={[
                                styles.image,
                                { height: imageHeight }
                            ]}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                            recyclingKey={postId}
                            transition={200} // Disable transition to prevent resize effect
                            priority="high"
                        />
                    </TouchableOpacity>
                )}

                {isImageLoaded && showTags && post.brands?.map((brand) => (
                    <TouchableOpacity
                        key={brand.id}
                        style={[
                            styles.tag,
                            {
                                left: `${brand.x_coord}%`,
                                top: `${brand.y_coord}%`,
                            },
                        ]}
                        onPress={() => handleBrandPress(brand.id, brand.name)}
                        activeOpacity={1}
                    >
                        <Text style={styles.tagText}>{brand.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Color palette section */}
            {imageColors && (
                <View style={styles.colorsContainer}>
                    <Text style={styles.colorsTitle}>Color Palette</Text>
                    <View style={styles.colorStrip}>
                        {imageColors?.colors?.slice(0, 5).map((color, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.colorSwatch,
                                    { backgroundColor: color }
                                ]}
                            >
                                {/* <Text style={styles.colorText}>{color}</Text> */}
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {post.description && (
                <>
                    <Text style={{ fontSize: 14, fontWeight: '600', paddingLeft: 15 }}>Description:</Text>
                    <Text style={styles.description}>{post.description}</Text>
                </>
            )
            }

            <View style={styles.brandsContainer}>
                <Text style={styles.brandsLabel}>Featured Brands:</Text>
                <View style={styles.brandsList}>
                    {post.brands?.map((brand) => (
                        <TouchableOpacity
                            key={brand.id}
                            style={styles.brandButton}
                            onPress={() => handleBrandPress(brand.id, brand.name)}
                            activeOpacity={1}
                        >
                            <Text style={styles.brandText}>{brand.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {post.styles && post.styles.length > 0 && (
                <View style={styles.stylesContainer}>
                    <Text style={styles.stylesLabel}>Styles:</Text>
                    <View style={styles.stylesList}>
                        {post.styles.map((style) => (
                            <View key={style.id} style={styles.styleChip}>
                                <Text style={styles.styleText}>{style.name}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    username: {
        fontSize: 14,
        fontWeight: '600',
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        backgroundColor: '#f0f0f0',
        marginBottom: 15,
        minHeight: 200, // Minimum height for loading state
    },
    loadingContainer: {
        width: '100%',
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        backgroundColor: '#f0f0f0',
    },
    description: {
        fontSize: 14,
        padding: 15,
    },
    brandsContainer: {
        padding: 15,
    },
    brandsLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5,
    },
    brandsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
    },
    brandButton: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    brandText: {
        fontSize: 12,
        color: '#000',
    },
    tag: {
        position: 'absolute',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 15,
        paddingVertical: 4,
        paddingHorizontal: 8,
        zIndex: 1,
    },
    tagText: {
        color: '#fff',
        fontSize: 12,
    },
    stylesContainer: {
        padding: 15,
    },
    stylesLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5,
    },
    stylesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
    },
    styleChip: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    styleText: {
        fontSize: 12,
        color: '#000',
    },
    colorsContainer: {
        padding: 15,
        backgroundColor: '#fff',
        marginBottom: 15,
    },
    colorsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    colorStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    colorSwatch: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 8,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    colorText: {
        fontSize: 8,
        color: '#fff',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});