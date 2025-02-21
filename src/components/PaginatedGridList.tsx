import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { FlatList } from 'react-native';

/**
 * A reusable paginated grid list component that handles common pagination patterns
 * 
 * @param {Object} props
 * @param {Array} props.data - The flattened data array from all pages
 * @param {Function} props.renderItem - Function to render each item
 * @param {Function} props.fetchNextPage - Function to fetch the next page
 * @param {boolean} props.hasNextPage - Whether there are more pages to load
 * @param {boolean} props.isFetchingNextPage - Whether the next page is currently loading
 * @param {boolean} props.isLoading - Whether the initial data is loading
 * @param {boolean} props.isError - Whether there was an error loading data
 * @param {Function} props.refetch - Function to refetch data
 * @param {Function} props.keyExtractor - Function to extract unique key for each item
 * @param {number} props.numColumns - Number of columns to display (default: 2)
 * @param {number} props.estimatedItemSize - Estimated size of each item for virtualization
 * @param {Object} props.emptyComponent - Component to show when there's no data
 * @param {Object} props.errorComponent - Component to show when there's an error
 * @param {Object} props.loadingComponent - Component to show during initial loading
 * @param {Object} props.contentContainerStyle - Style for the content container
 * @param {string} props.loadingMoreText - Text to show when loading more items
 * @param {Object} props.listProps - Additional props to pass to FlashList
 */
export function PaginatedGridList({
    data = [],
    header,
    renderItem,
    fetchNextPage,
    hasNextPage = false,
    isFetchingNextPage = false,
    isLoading = false,
    isError = false,
    refetch,
    keyExtractor,
    numColumns = 2,
    estimatedItemSize = 250,
    emptyComponent,
    errorComponent,
    loadingComponent,
    contentContainerStyle,
    loadingMoreText = "Loading more items...",
    listProps = {}
}) {
    console.log('[PaginatedGridList] Rendering with', data.length, 'items, hasNextPage:', hasNextPage);

    // Handle refresh - resets to first page
    const handleRefresh = useCallback(() => {
        console.log('[PaginatedGridList] Refresh triggered');
        if (refetch) {
            refetch({ refetchPage: (_data, index) => index === 0 });
        }
    }, [refetch]);

    // Handle loading more items - directly pass through to the provided fetchNextPage
    const handleLoadMore = useCallback(() => {
        console.log(
            '[PaginatedGridList] onEndReached called -',
            'hasNextPage:', hasNextPage,
            'isFetchingNextPage:', isFetchingNextPage
        );

        if (fetchNextPage && hasNextPage && !isFetchingNextPage) {
            console.log('[PaginatedGridList] Calling fetchNextPage');
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    // Render loading indicator at bottom during pagination
    const renderFooter = useCallback(() => {
        if (!isFetchingNextPage) return null;

        console.log('[PaginatedGridList] Rendering footer loader');
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.footerText}>{loadingMoreText}</Text>
            </View>
        );
    }, [isFetchingNextPage, loadingMoreText]);

    // Handle loading state
    if (isLoading && data.length === 0) {
        console.log('[PaginatedGridList] Showing loading state');
        return loadingComponent || (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    // Handle error state
    if (isError && data.length === 0) {
        console.log('[PaginatedGridList] Showing error state');
        return errorComponent || (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                    Error loading items. Pull down to try again.
                </Text>
            </View>
        );
    }

    if (data.length === 0 || data == undefined || data == null || data[0] == undefined) {
        console.log('[PaginatedGridList] Showing empty state');
        return (
            <>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No items found.</Text>
                </View>
            </>
        );
    }

    // Either use the provided footer or our default one
    const footerComponent = listProps.ListFooterComponent || renderFooter;

    console.log('[PaginatedGridList] Rendering FlashList');
    return (
        <View style={styles.container}>
            <FlashList
                data={data}
                ListHeaderComponent={header}
                numColumns={numColumns}
                renderItem={renderItem}
                estimatedItemSize={estimatedItemSize}
                keyExtractor={keyExtractor}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.2}
                ListFooterComponent={footerComponent}
                refreshing={isLoading}
                onRefresh={handleRefresh}
                showsVerticalScrollIndicator={false}
                {...listProps}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    listContent: {
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 20,
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
        flexDirection: 'row',
    },
    footerText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
});