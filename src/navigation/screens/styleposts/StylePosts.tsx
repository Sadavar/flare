import React, { useCallback, useMemo } from 'react';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { CustomText } from '@/components/CustomText';
import { usePostsByStyle } from '@/hooks/usePostQueries';
import { PaginatedGridList } from '@/components/PaginatedGridList';
import PostCard from '@/components/PostCard';
import { Post } from '@/types';
import { Ionicons } from '@expo/vector-icons';

// Memoize the post item to prevent unnecessary re-renders
const MemoizedPostCard = React.memo(PostCard);

export function StylePosts() {
    const route = useRoute();
    const navigation = useNavigation();
    const { styleId, styleName } = route.params as { styleId?: number, styleName?: string };
    console.log(styleId, styleName)

    // Set up the page title with the style name
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: styleName?.toUpperCase(),
            headerTitleStyle: {
                fontFamily: 'BebasNnue-Regular',
                fontSize: '20',
                color: '#fff',
            },
            headerLeft: () => (
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
            ),
        });
    }, [navigation, styleName]);

    // Fetch posts for this style - use a larger limit for the dedicated screen
    const {
        data,
        isLoading,
        isError,
        refetch
    } = usePostsByStyle(styleId, 20);

    // Flatten the pages of posts
    const posts = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap(page => page.posts);
    }, [data]);

    const renderPostItem = useCallback(({ item }: { item: Post }) => {
        return <MemoizedPostCard post={item} />;
    }, []);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <CustomText style={styles.loadingText}>Loading posts...</CustomText>
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.errorContainer}>
                <CustomText style={styles.errorText}>
                    Something went wrong. Please try again.
                </CustomText>
            </View>
        );
    }

    if (posts.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <CustomText style={styles.emptyText}>
                    No posts found for this style.
                </CustomText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <PaginatedGridList
                data={posts}
                renderItem={renderPostItem}
                fetchNextPage={() => { }}
                hasNextPage={false}
                isFetchingNextPage={false}
                isLoading={isLoading}
                isError={isError}
                refetch={refetch}
                keyExtractor={(item: Post) => item.uuid}
                numColumns={2}
                estimatedItemSize={280}
                contentContainerStyle={styles.gridContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        marginTop: 12,
        color: '#fff',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000',
    },
    errorText: {
        color: '#ff4d4d',
        fontSize: 16,
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000',
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
    },
    countText: {
        fontSize: 16,
        color: '#fff',
        padding: 12,
    },
    gridContent: {
        padding: 6,
    },
    backButton: {
        marginLeft: 12,
    },
});