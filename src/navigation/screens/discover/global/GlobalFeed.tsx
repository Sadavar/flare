import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
// import { Image } from 'react-native';
import { useGlobalFeed } from '@/hooks/usePostQueries';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Post } from '@/types';
import { PaginatedGridList } from '@/components/PaginatedGridList';
import { MaterialIcons } from '@expo/vector-icons';

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

function Header() {
    return (
        <>

            <View style={styles.fixedHeader}>

                <Text style={styles.mainTitle}>Discover Globally</Text>

                <GlobalSearch

                />

            </View>

        </>
    )
}

export function GlobalFeed2() {
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch
    } = useGlobalFeed(5);
    const allPosts = data?.pages?.flat() || [];
    return (
        <PaginatedGridList
            data={allPosts}
            renderItem={
                ({ item, index }) => {
                    return (
                        <View style={styles.postContainer}>
                            <Text>{item.uuid}</Text>
                            <Text>{item.image_url}</Text>
                            <Image
                                // key={index}
                                source={{ uri: item.image_url }}
                                // source={{ uri: "https://img.freepik.com/free-photo/woman-beach-with-her-baby-enjoying-sunset_52683-144131.jpg?size=626&ext=jpg" }}
                                // source={{ uri: "https://yhnamwhotpnhgcicqpmd.supabase.co/storage/v1/object/public/outfits/outfits/d517ed74-5bfe-4e3f-b2ec-e06549ec43ee/9c01e28e-cf03-4ebf-ba7f-0ae0ee41607f.jpg?width=800" }}
                                style={{ width: 400, height: 200 }}
                                onError={() => {
                                    console.log("Error loading image");
                                }}
                            />
                        </View>
                    )
                }
            }
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isLoading={isLoading}
            isError={isError}
            refetch={refetch}
            keyExtractor={(item) => item.uuid}
            numColumns={2}
            estimatedItemSize={250}
            loadingMoreText="Loading more posts..."
            contentContainerStyle={styles.listContent}
        />
    )
}

export function GlobalFeed() {
    const navigation = useNavigation();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch
    } = useGlobalFeed(10);

    const isFocused = useIsFocused();

    useEffect(() => {
        if (!isFocused) return;
        refetch();
    }, [isFocused]);

    // Flatten posts from all pages
    const allPosts = data?.pages?.flat() || [];

    // Render each post
    const renderItem = useCallback(({ item }: { item: Post }) => {
        console.log(item.image_url);
        return (
            <View>
                <TouchableOpacity
                    style={styles.postContainer}
                    onPress={() => navigation.navigate('PostDetails', { post: item })}
                >
                    <Image
                        source={{ uri: item.image_url }}
                        style={styles.postImage}
                        contentFit="cover"
                        transition={300}
                        onError={() => {
                            console.log("Error loading image");
                        }}
                    />
                </TouchableOpacity>


                {item.brands && item.brands.length > 0 && (
                    <View style={styles.brandsContainer}>
                        <Text style={styles.brandsLabel}>Brands</Text>
                        <View style={styles.brandsList}>
                            {item.brands.slice(0, 2).map((brand) => (
                                <TouchableOpacity
                                    key={brand.id}
                                    style={styles.brandButton}
                                    onPress={() => navigation.navigate('Brands', {
                                        screen: 'BrandDetails',
                                        params: { brandId: brand.id, brandName: brand.name }
                                    })}
                                >
                                    <Text style={styles.brandText}>{brand.name}</Text>
                                </TouchableOpacity>
                            ))}
                            {item.brands.length > 2 && (
                                <View style={styles.brandButton}>
                                    <Text style={styles.brandText}>+{item.brands.length - 2}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </View>
        )
    }, [navigation]);



    return (
        <PaginatedGridList
            data={allPosts}
            header={Header}
            renderItem={renderItem}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isLoading={isLoading}
            isError={isError}
            refetch={refetch}
            keyExtractor={(item) => item.uuid}
            numColumns={2}
            estimatedItemSize={250}
            loadingMoreText="Loading more posts..."
            contentContainerStyle={styles.listContent}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
    listContent: {
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 20,
    },
    postContainer: {
        flex: 1,
        margin: 6,
        borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        overflow: 'hidden',
    },
    postImage: {
        width: '100%',
        aspectRatio: 0.75, // 3:4 aspect ratio (width:height)
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
    },
    brandsContainer: {
        margin: 10,
    },
    brandsLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: '#888',
        marginBottom: 4,
    },
    brandsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    brandButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#f5f5f5',
        borderRadius: 6,
    },
    brandText: {
        fontSize: 10,
        color: '#555',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#e53935',
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    footerLoader: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },
});