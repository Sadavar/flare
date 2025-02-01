import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { BrandsStackParamList } from '@/navigation/types';
import { Layout } from '@/components/Layout';
import { useNavigation } from '@react-navigation/native';

type BrandDetailsRouteProp = RouteProp<BrandsStackParamList, 'BrandDetails'>;

interface Post {
    uuid: string;
    image_url: string;
    user: {
        username: string;
    };
}

interface Product {
    id: string;
    image_url: string;
    name: string;
}

type TabType = 'products' | 'posts';

export function BrandDetails() {
    const route = useRoute<BrandDetailsRouteProp>();
    const { brandId, brandName } = route.params;
    const [activeTab, setActiveTab] = useState<TabType>('products');
    const navigation = useNavigation();

    // Query for brand posts
    const { data: posts, isLoading: postsLoading } = useQuery({
        queryKey: ['brandPosts', brandId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('post_brands')
                .select(`
                    posts (
                        uuid,
                        image_url,
                        profiles!posts_user_uuid_fkey (
                            username
                        )
                    )
                `)
                .eq('brand_id', brandId);

            if (error) throw error;

            return data.map(({ posts: post }) => ({
                uuid: post.uuid,
                image_url: supabase.storage
                    .from('outfits')
                    .getPublicUrl(post.image_url).data.publicUrl,
                user: {
                    username: post.profiles.username
                }
            }));
        },
    });

    // Placeholder query for products (implement when you have products table)
    const { data: products, isLoading: productsLoading } = useQuery({
        queryKey: ['brandProducts', brandId],
        queryFn: async () => {
            // Placeholder data
            return [] as Product[];
        },
    });

    const renderPost = ({ item }: { item: Post }) => (
        <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('PostDetails', { postId: item.uuid })}
        >
            <Image
                source={{ uri: item.image_url }}
                style={styles.image}
                contentFit="cover"
            />
        </TouchableOpacity>
    );

    const renderProduct = ({ item }: { item: Product }) => (
        <View style={styles.gridItem}>
            <Image
                source={{ uri: item.image_url }}
                style={styles.image}
                contentFit="cover"
            />
        </View>
    );

    return (
        <Layout>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.profileSection}>
                        <View style={styles.brandIcon}>
                            <MaterialIcons name="store" size={40} color="black" />
                        </View>
                        <View style={styles.brandInfo}>
                            <Text style={styles.brandName}>{brandName}</Text>
                            <Text style={styles.bio}>Premium fashion brand | Est. 2023</Text>
                        </View>
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{products?.length || 0}</Text>
                            <Text style={styles.statLabel}>Products</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>2.5K</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{posts?.length || 0}</Text>
                            <Text style={styles.statLabel}>Tags</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.followButton}>
                        <Text style={styles.followButtonText}>Follow</Text>
                    </TouchableOpacity>

                    <View style={styles.tabContainer}>
                        <Pressable
                            style={[styles.tab, activeTab === 'products' && styles.activeTab]}
                            onPress={() => setActiveTab('products')}
                        >
                            <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>Products</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
                            onPress={() => setActiveTab('posts')}
                        >
                            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>Tagged Posts</Text>
                        </Pressable>
                    </View>
                </View>

                {activeTab === 'products' ? (
                    productsLoading ? (
                        <Text style={styles.loadingText}>Loading products...</Text>
                    ) : (
                        <FlashList
                            data={products}
                            renderItem={renderProduct}
                            numColumns={3}
                            estimatedItemSize={124}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No products yet</Text>
                            }
                        />
                    )
                ) : (
                    postsLoading ? (
                        <Text style={styles.loadingText}>Loading posts...</Text>
                    ) : (
                        <FlashList
                            data={posts}
                            renderItem={renderPost}
                            numColumns={3}
                            estimatedItemSize={124}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No posts yet</Text>
                            }
                        />
                    )
                )}
            </View>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    brandIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    brandInfo: {
        flex: 1,
    },
    brandName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    bio: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 15,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    followButton: {
        backgroundColor: '#000',
        paddingVertical: 12,
        borderRadius: 8,
        marginVertical: 15,
    },
    followButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
    },
    tabContainer: {
        flexDirection: 'row',
        marginTop: 15,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#000',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
    },
    activeTabText: {
        color: '#000',
        fontWeight: '600',
    },
    gridItem: {
        flex: 1,
        aspectRatio: 1,
        margin: 1,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#666',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#666',
    },
}); 