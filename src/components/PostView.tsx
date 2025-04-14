import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Dimensions, ActivityIndicator, Animated } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/context/SessionContext';
import { useNavigation } from '@react-navigation/native';
import type { Post } from '@/types';
import { useSavePost, useUserPosts } from '@/hooks/usePostQueries';
import { Username } from '@/navigation/screens/auth/Username';
import { usePost } from '@/hooks/usePostQueries'
import { ColorCard } from '@/components/ColorCard';
import ColorDisplay from './ColorDisplay';
import { theme } from '@/context/ThemeContext';
import { CustomText } from './CustomText';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Constants for image loading
const BLUR_HASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4'; // Default blurhash for image placeholders

interface PostViewProps {
    post: Post;
    viewType?: "StandardView" | "FriendsView" | "ProfileView"
}

export function PostView({ post, viewType }: PostViewProps) {
    const { username: currentUsername } = useSession();
    const navigation = useNavigation();
    const [showTags, setShowTags] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [imageLoadError, setImageLoadError] = useState(false);
    const [showLoader, setShowLoader] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const imageOpacity = useRef(new Animated.Value(0)).current;
    const loaderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { mutate: toggleSave } = useSavePost();
    const [isSaved, setIsSaved] = useState(post.saved || false);

    // Update saved status when post changes
    useEffect(() => {
        if (post && post.saved !== undefined && post.saved !== null)
            setIsSaved(post.saved)
    }, [post]);

    // Animation effect for tags
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: showTags && isImageLoaded ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [showTags, fadeAnim, isImageLoaded]);

    // Set up delayed loader
    useEffect(() => {
        if (!isImageLoaded && !imageLoadError) {
            // Clear any existing timeout
            if (loaderTimeoutRef.current) {
                clearTimeout(loaderTimeoutRef.current);
            }

            // Set a new timeout to show loader after 1 second
            loaderTimeoutRef.current = setTimeout(() => {
                if (!isImageLoaded && !imageLoadError) {
                    setShowLoader(true);
                }
            }, 1000);
        } else {
            // Image is loaded or errored, hide loader
            setShowLoader(false);

            // Clear timeout if it exists
            if (loaderTimeoutRef.current) {
                clearTimeout(loaderTimeoutRef.current);
                loaderTimeoutRef.current = null;
            }
        }

        // Clean up timeout on component unmount
        return () => {
            if (loaderTimeoutRef.current) {
                clearTimeout(loaderTimeoutRef.current);
                loaderTimeoutRef.current = null;
            }
        };
    }, [isImageLoaded, imageLoadError]);

    // Animation for image fade-in
    const handleImageLoad = useCallback(() => {
        setIsImageLoaded(true);
        Animated.timing(imageOpacity, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
        }).start();
    }, [imageOpacity]);

    const handleImageError = useCallback(() => {
        console.error("Failed to load image:", post.image_url);
        setImageLoadError(true);
        setIsImageLoaded(true); // Consider the loading process complete, even with error
    }, [post.image_url]);

    // Pre-load the image when component mounts
    useEffect(() => {
        if (post?.image_url) {
            // Reset states on new image
            setIsImageLoaded(false);
            setImageLoadError(false);
            setShowLoader(false);
            imageOpacity.setValue(0);

            // Optionally pre-cache the image
            Image.prefetch(post.image_url).catch(() => {
                console.warn("Failed to prefetch image:", post.image_url);
            });
        }
    }, [post?.image_url, imageOpacity]);

    const handleSave = () => {
        setIsSaved(!isSaved);
        toggleSave(
            { post: post, saved: isSaved },
            {
                onError: () => {
                    setIsSaved(isSaved);
                }
            }
        );
    };

    if (!post) {
        return (
            <View style={styles.container}>
                <CustomText>Post not found</CustomText>
            </View>
        );
    }

    const handleUserPress = (username: string) => {
        if (username === currentUsername) {
            navigation.getParent()?.navigate('Profile', { screen: 'ProfileMain' });
        } else {
            navigation.navigate('UserProfile', { username });
        }
    };

    const handleBrandPress = (brandId: number, brandName: string) => {
        navigation.navigate('BrandDetails', { brandId, brandName })
    };

    const toggleTagsVisibility = () => {
        setShowTags((prevState) => !prevState);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                {viewType === "StandardView" && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={24}
                            color={theme.colors.text}
                        />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[
                        styles.userInfo,
                        viewType !== "StandardView" && styles.userInfoWithPadding
                    ]}
                    onPress={() => handleUserPress(post.username)}
                    activeOpacity={1}
                >
                    <View style={styles.userIcon}>
                        <MaterialIcons name="person" size={24} color="black" />
                    </View>
                    <CustomText style={styles.username}>@{post.username}</CustomText>
                </TouchableOpacity>
            </View>

            <View style={styles.imageContainer}>
                {/* Loading indicator - only shown after 1 second delay */}
                {showLoader && !isImageLoaded && !imageLoadError && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                )}

                {/* Error state */}
                {imageLoadError && (
                    <View style={styles.errorContainer}>
                        <MaterialIcons name="broken-image" size={50} color={theme.colors.light_background_3} />
                        <CustomText style={styles.errorText}>Unable to load image</CustomText>
                    </View>
                )}

                <TouchableOpacity
                    onPress={toggleTagsVisibility}
                    activeOpacity={1}
                    style={{ width: '100%', height: '100%' }}
                >
                    <Animated.View style={{ opacity: imageOpacity, width: '100%', height: '100%' }}>
                        <Image
                            source={{ uri: post.image_url }}
                            style={styles.image}
                            contentFit="cover"
                            recyclingKey={post.uuid}
                            priority="high"
                            placeholder={BLUR_HASH}
                            contentPosition="center"
                            cachePolicy="memory-disk"
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />
                    </Animated.View>
                </TouchableOpacity>

                {post.brands && post.brands.length > 0 && (
                    <TouchableOpacity
                        style={[
                            styles.brandToggleButton,
                            isImageLoaded ? null : styles.hidden
                        ]}
                        onPress={toggleTagsVisibility}
                        activeOpacity={0.7}
                        disabled={!isImageLoaded}
                    >
                        <MaterialIcons
                            name="local-offer"
                            size={22}
                            color={showTags ? theme.colors.light_background_3 : "white"}
                        />
                    </TouchableOpacity>
                )}

                {post.brands?.map((brand) => (
                    <Animated.View
                        key={brand.id}
                        style={[
                            styles.tag,
                            {
                                left: `${brand.x_coord}%`,
                                top: `${brand.y_coord}%`,
                                opacity: fadeAnim,
                            },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => handleBrandPress(brand.id, brand.name)}
                            activeOpacity={1}
                        >
                            <CustomText style={styles.tagText}>{brand.name}</CustomText>
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>

            <ColorDisplay post={post} />

            {post.description && (
                <>
                    <CustomText style={{ fontSize: 14, fontWeight: '600', paddingLeft: 15 }}>Description:</CustomText>
                    <CustomText style={styles.description}>{post.description}</CustomText>
                </>
            )}

            {post.brands && post.brands.length > 0 && (
                <View style={styles.brandsContainer}>
                    <CustomText style={styles.brandsLabel}>Featured Brands:</CustomText>
                    <View style={styles.brandsList}>
                        {post.brands?.map((brand) => (
                            <TouchableOpacity
                                key={brand.id}
                                style={styles.brandButton}
                                onPress={() => handleBrandPress(brand.id, brand.name)}
                                activeOpacity={1}
                            >
                                <CustomText style={styles.brandText}>{brand.name}</CustomText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {post.styles && post.styles.length > 0 && (
                <View style={styles.stylesContainer}>
                    <CustomText style={styles.stylesLabel}>Styles:</CustomText>
                    <View style={styles.stylesList}>
                        {post.styles.map((style) => (
                            <View key={style.id} style={styles.styleChip}>
                                <CustomText style={styles.styleText}>{style.name}</CustomText>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {post.username !== currentUsername && (
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                >
                    <MaterialIcons
                        name={isSaved ? "bookmark" : "bookmark-outline"}
                        size={24}
                        color={theme.colors.light_background_3}
                    />
                    <CustomText style={styles.saveButtonText}>
                        {isSaved ? "Unsave" : "Save"}
                    </CustomText>
                </TouchableOpacity>
            )}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 15,
        paddingBottom: 15,
        paddingRight: 15,
        justifyContent: 'space-between',
    },
    backButton: {
        marginRight: 5,
        paddingLeft: 5
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    userInfoWithPadding: {
        paddingLeft: 5,
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
        backgroundColor: theme.colors.background,
        marginBottom: 15,
        height: Math.round(SCREEN_HEIGHT * 0.6),
        overflow: 'hidden',
    },
    loadingContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        zIndex: 1,
    },
    errorContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        zIndex: 1,
    },
    errorText: {
        marginTop: 10,
        color: theme.colors.light_background_3,
    },
    image: {
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.background,
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
        backgroundColor: theme.colors.light_background_1,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    brandText: {
        fontSize: 12,
    },
    tag: {
        position: 'absolute',
        transform: [{ translateX: -50 }, { translateY: -10 }],
        backgroundColor: theme.colors.light_background_1,
        borderRadius: 15,
        paddingVertical: 4,
        paddingHorizontal: 8,
        zIndex: 1,
    },
    tagText: {
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
        backgroundColor: theme.colors.light_background_1,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    styleText: {
        fontSize: 12,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        marginBottom: 10,
        backgroundColor: theme.colors.light_background_1,
        borderRadius: 8,
    },
    saveButtonText: {
        marginLeft: 8,
        fontSize: 16,
    },
    brandToggleButton: {
        position: 'absolute',
        right: 15,
        bottom: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    hidden: {
        display: 'none',
    },
});