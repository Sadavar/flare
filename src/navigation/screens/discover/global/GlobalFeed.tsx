import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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

    const { data: posts, isLoading } = useGlobalFeed();

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

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!posts?.length) {
        return (
            <View style={styles.container}>
                <Text>No posts yet</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MasonryList
                ListHeaderComponent={
                    <>
                        <View style={styles.fixedHeader}>
                            <Text style={styles.mainTitle}>Discover Globally</Text>
                            <GlobalSearch
                            />
                        </View>
                    </>
                }
                data={posts}
                keyExtractor={(item) => item.uuid}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.masonryContent}
                renderItem={({ item, i }) => {
                    const post = item as Post;
                    console.log(item)
                    console.log("Global feed")
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
                                />
                            </TouchableOpacity>

                            {post.brands?.length > 0 && (
                                <View style={styles.brandsContainer}>
                                    <Text style={styles.brandsLabel}>Featured Brands:</Text>
                                    <View style={styles.brandsList}>
                                        {post.brands.map((brand) => (
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
});