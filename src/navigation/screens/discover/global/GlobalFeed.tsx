import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity, TextInput } from 'react-native';
import { Image } from 'expo-image';
// import { Image } from 'react-native';
import { useGlobalFeed, useSavedPostStatus } from '@/hooks/usePostQueries';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Post } from '@/types';
import { PaginatedGridList } from '@/components/PaginatedGridList';
import { MaterialIcons } from '@expo/vector-icons';
import PostCard from '@/components/PostCard';
import { CustomText } from '@/components/CustomText';
import { theme } from '@/context/ThemeContext';


function GlobalSearch() {
    const styles = StyleSheet.create({
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 0.5,
            borderColor: '#000',
            borderRadius: 20,
            paddingHorizontal: 10,
            backgroundColor: theme.colors.light_background_1,
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
            <MaterialIcons name="search" size={30} color={theme.colors.light_background_2} style={styles.searchIcon} />
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

                <CustomText style={styles.mainTitle}>Discover Globally</CustomText>

                <GlobalSearch

                />

            </View>

        </>
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

    // Flatten posts from all pages
    const allPosts = data?.pages?.flat() || [];
    console.log("got all posts", allPosts)

    // Render each post
    const renderItem = useCallback(({ item }: { item: Post }) => {
        return (
            <PostCard post={item} />
        )
    }, [navigation]);

    return (
        <PaginatedGridList
            data={allPosts}
            header={<Header />}
            renderItem={renderItem}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isLoading={isLoading}
            isError={isError}
            refetch={() => {
                console.log("refetching")
                refetch()
            }}
            keyExtractor={(item: Post) => item.uuid}
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
    },
    fixedHeader: {
        paddingTop: 10,
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
        backgroundColor: 'grey',
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
        backgroundColor: 'white',
        borderRadius: 12,
    },
    postDetails: {
        backgroundColor: 'white',
        width: '100%',
        paddingHorizontal: 3,
    },
    brandsContainer: {
        paddingBottom: 10,
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
    colorDotsContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    saveButton: {
        padding: 0,
    },
});