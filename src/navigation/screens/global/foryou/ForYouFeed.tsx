import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Image } from 'expo-image';
// import { Image } from 'react-native';
import { useGlobalFeed } from '@/hooks/usePostQueries';
import { NavigationProp, useIsFocused, useNavigation } from '@react-navigation/native';
import { DiscoverTabParamList, Post } from '@/types';
import { PaginatedGridList } from '@/components/PaginatedGridList';
import { MaterialIcons } from '@expo/vector-icons';
import PostCard from '@/components/PostCard';
import { CustomText } from '@/components/CustomText';
import { theme } from '@/context/ThemeContext';
import { SearchButton } from '@/components/SearchButton';
import { SkeletonLoader } from '@/components/SkeletonLoader';

function Header() {
    return (
        <>
            <View style={styles.fixedHeader}>
                <CustomText style={styles.mainTitle}>Discover Globally</CustomText>
                {/* <SearchButton type={'global'} /> */}
            </View>
        </>
    )
}

function SkeletonPostCard() {
    return (
        <View style={[styles.postContainer, { margin: 6 }]}>
            <SkeletonLoader
                width="100%"
                height={undefined} // Remove fixed height
                style={{
                    aspectRatio: 0.75, // Match PostCard's aspect ratio
                    borderRadius: 12,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0
                }}
            />
            <View style={styles.postDetails}>
                <View style={[styles.actionsRow, { paddingVertical: 5 }]}>
                    {/* Colors skeleton */}
                    <View style={styles.colorDotsContainer}>
                        {[1, 2, 3].map((_, index) => (
                            <SkeletonLoader
                                key={index}
                                width={14}
                                height={14}
                                style={{
                                    borderRadius: 4,
                                    marginRight: index < 2 ? 4 : 0
                                }}
                            />
                        ))}
                    </View>
                    {/* Save button skeleton */}
                    <SkeletonLoader
                        width={25}
                        height={25}
                        style={{ borderRadius: 4 }}
                    />
                </View>

                {/* Brands skeleton */}
                <View style={styles.brandsContainer}>
                    <View style={styles.brandsList}>
                        {[1, 2].map((_, index) => (
                            <SkeletonLoader
                                key={index}
                                width={60}
                                height={22}
                                style={{
                                    borderRadius: 6,
                                    marginRight: 6,
                                    marginBottom: 10
                                }}
                            />
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
}

export function ForYouFeed() {
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

    // Render each post
    const renderItem = useCallback(({ item }: { item: Post }) => {
        return (
            <PostCard post={item} />
        )
    }, [navigation]);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Header />
                <ScrollView>
                    <View style={[styles.listContent, styles.gridContainer]}>
                        {[1, 2, 3, 4, 5, 6].map((_, index) => (
                            <SkeletonPostCard key={index} />
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    }

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
        paddingTop: 15,
        paddingBottom: 20,
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
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 2,
        backgroundColor: theme.colors.light_background_1,
        minWidth: '45%', // Ensure two columns
        maxWidth: '48%', // Prevent stretching
    },
    postImage: {
        width: '100%',
        aspectRatio: 0.75, // 3:4 aspect ratio (width:height)
        backgroundColor: 'white',
        borderRadius: 12,
    },
    postDetails: {
        width: '100%',
        paddingHorizontal: 3,
        paddingTop: 1,
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
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 2, // Adjust to match PaginatedGridList padding
    },
});