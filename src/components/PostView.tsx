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

// Get screen width
const SCREEN_WIDTH = Dimensions.get('window').width;

interface PostViewProps {
    post: Post;
}

export function PostView2({ post }: PostViewProps) {
    const { username: currentUsername } = useSession();
    const navigation = useNavigation();
    const [showTags, setShowTags] = useState(true);
    const [imageHeight, setImageHeight] = useState(undefined);

    console.log('post', post);

    return (
        <Image
            source={{ uri: post?.image_url }}
            style={{ width: '100%', height: 200 }}
            priority="high"
        />
    )
}

export function PostView({ post }: PostViewProps) {
    const { username: currentUsername } = useSession();
    const navigation = useNavigation();
    const [showTags, setShowTags] = useState(true);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [imageHeight, setImageHeight] = useState(undefined);
    const loadingStartTimeRef = useRef(Date.now());

    const handleOnLoad = useCallback((event) => {
        // Calculate actual height based on natural image dimensions
        const { width, height } = event.source;
        const aspectRatio = width / height;
        const calculatedHeight = SCREEN_WIDTH / aspectRatio;
        setImageHeight(calculatedHeight);

    }, [post?.image_url]);

    const handleImageError = useCallback((error) => {
        console.error('Error loading image:', error);
        // Set a default aspect ratio on error
        setImageHeight(SCREEN_WIDTH);
        setIsImageLoaded(true);
    }, []);

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
                        recyclingKey={post.uuid}
                        transition={200} // Disable transition to prevent resize effect
                        priority="high"
                    />
                </TouchableOpacity>

                {post.brands?.map((brand) => (
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