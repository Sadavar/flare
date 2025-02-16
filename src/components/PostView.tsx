import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

interface PostViewProps {
    postId: string;
}

export function PostView({ postId }: PostViewProps) {
    const { username: currentUsername } = useSession();
    const navigation = useNavigation();
    const [showTags, setShowTags] = useState(true);

    const { data: post, isLoading } = usePost(postId)

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
        console.log(username);
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
        console.log(brandId, brandName);
        navigation.navigate('Brands', {
            screen: 'BrandDetails',
            params: { brandId, brandName },
        });
    };

    const toggleTagsVisibility = () => {
        setShowTags((prevState) => !prevState);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.userInfo}
                    onPress={() => handleUserPress(post.username)}
                    activeOpacity={1}  // Add activeOpacity for TouchableOpacity
                >
                    <View style={styles.userIcon}>
                        <MaterialIcons name="person" size={24} color="black" />
                    </View>
                    <Text style={styles.username}>@{post.username}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.imageContainer}>
                <TouchableOpacity onPress={toggleTagsVisibility} activeOpacity={1}>
                    <Image
                        source={{ uri: post.image_url }}
                        style={styles.image}
                        contentFit="contain"
                    />
                </TouchableOpacity>
                {showTags && post.brands?.map((brand) => (
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
        </View >
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
        marginBottom: 15,
    },
    image: {
        height: 300,
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
});