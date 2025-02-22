import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Button, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { ProfileStackParamList } from '@/types';
import { Layout } from '@/components/Layout';
import { usePost, useDeletePost } from '@/hooks/usePostQueries';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { Post } from '../post/Post';



type PostDetailsRouteProp = RouteProp<ProfileStackParamList, 'PostDetails'>;

export function PostDetails() {
    const route = useRoute<PostDetailsRouteProp>();
    const navigation = useNavigation();
    const { post } = route.params;
    const [showTags, setShowTags] = useState(true);

    const { deletePost } = useDeletePost();

    const queryClient = useQueryClient();

    const handleDelete = async () => {
        Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        // Navigate back
                        await deletePost(post.uuid);
                        navigation.goBack();
                    },
                },
            ]
        );
    };

    const handleBrandPress = (brandId: number, brandName: string) => {
        navigation.getParent()?.navigate('Discover', {
            screen: 'Brands',
            params: {
                screen: 'BrandDetails',
                params: { brandId, brandName }
            }
        });
    };


    const toggleTagsVisibility = () => {
        setShowTags((prevState) => !prevState);
    };



    if (!post) {
        return (
            <Layout>
                <View style={styles.container}>
                    <Text>Post not found</Text>
                </View>
            </Layout>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.imageContainer}>
                <TouchableOpacity onPress={toggleTagsVisibility} activeOpacity={1}>
                    <Image
                        source={{ uri: post.image_url }}
                        style={styles.image}
                        contentFit="contain"
                        transition={200}
                        priority="high"
                        onError={(error) => {
                            console.error('Error loading image:', error);
                        }}
                    />
                </TouchableOpacity>
                {showTags && post.brands?.map((brand) => (
                    <View
                        key={brand.id}
                        style={[
                            styles.tag,
                            {
                                left: `${brand.x_coord}%`,
                                top: `${brand.y_coord}%`,
                            },
                        ]}
                    >
                        <Text style={styles.tagText}>{brand.name}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.detailsContainer}>
                {/* <Text style={styles.date}>
                        {new Date(post.created_at).toLocaleDateString()}
                    </Text> */}
                <Text style={styles.brandsLabel}>Description:</Text>
                {post.description && (
                    <Text style={styles.description}>{post.description}</Text>
                )}
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

                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                        console.log('[PostDetails] Post:', post);
                        navigation.navigate('PostEdit', { post: post as Post });
                    }}
                >
                    <MaterialIcons name="edit" size={24} color="#007AFF" />
                    <Text style={styles.editButtonText}>Edit Post</Text>
                </TouchableOpacity>

                <Button
                    title="Delete Post"
                    onPress={handleDelete}
                    color="#FF3B30"
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 400,
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
    detailsContainer: {
        padding: 20,
    },
    date: {
        color: '#666',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        marginBottom: 20,
    },
    brandsContainer: {
        marginBottom: 20,
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
    stylesContainer: {
        marginBottom: 20,
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
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    editButtonText: {
        marginLeft: 8,
        color: '#007AFF',
        fontSize: 16,
    },
});