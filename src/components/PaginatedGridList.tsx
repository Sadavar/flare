import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, RefreshControl, ScrollView } from 'react-native';
import { MasonryFlashList } from '@shopify/flash-list';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP_SIZE = 8; // Matches the listContent paddingHorizontal

/**
 * A reusable paginated masonry list component that handles common pagination patterns
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

    // Keep track of column heights for masonry layout
    const columnHeights = useRef(Array(numColumns).fill(0));

    // Calculate column width based on screen width, number of columns, and gaps
    const getColumnWidth = useCallback(() => {
        const totalGapWidth = GAP_SIZE * (numColumns + 1);
        return (SCREEN_WIDTH - totalGapWidth) / numColumns;
    }, [numColumns]);

    // Get the shortest column index for optimal item placement
    const getShortestColumnIndex = useCallback(() => {
        return columnHeights.current.indexOf(Math.min(...columnHeights.current));
    }, []);

    // Calculate item height based on its content
    const getItemHeight = useCallback((item) => {
        // If item has a predefined height or aspect ratio, use that
        if (item.height) return item.height;
        if (item.aspectRatio) return getColumnWidth() / item.aspectRatio;

        // Default height if no other metrics available
        return estimatedItemSize;
    }, [getColumnWidth, estimatedItemSize]);

    // Reset column heights when data changes
    const resetColumnHeights = useCallback(() => {
        columnHeights.current = Array(numColumns).fill(0);
    }, [numColumns]);

    // Enhanced overrideItemLayout for masonry
    const overrideItemLayout = useCallback(({ item, index }) => {
        if (!item || !item.image_url || item === undefined || item === null) return null;
        const columnWidth = getColumnWidth();
        const itemHeight = getItemHeight(item);
        const shortestColumnIndex = getShortestColumnIndex();

        // Calculate position
        const xOffset = GAP_SIZE + (shortestColumnIndex * (columnWidth + GAP_SIZE));
        const yOffset = columnHeights.current[shortestColumnIndex];

        // Update column height
        columnHeights.current[shortestColumnIndex] += itemHeight + GAP_SIZE;

        return {
            length: itemHeight,
            offset: yOffset,
            index,
            // Additional layout information
            width: columnWidth,
            columnIndex: shortestColumnIndex,
            x: xOffset,
            y: yOffset
        };
    }, [getColumnWidth, getItemHeight, getShortestColumnIndex]);

    // Handle refresh - resets to first page
    const handleRefresh = useCallback(() => {
        console.log('[PaginatedGridList] Refresh triggered');
        resetColumnHeights();
        if (refetch) {
            refetch({ refetchPage: (_data, index) => index === 0 });
        }
    }, [refetch, resetColumnHeights]);

    // Handle loading more items
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

        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.footerText}>{loadingMoreText}</Text>
            </View>
        );
    }, [isFetchingNextPage, loadingMoreText]);

    // Handle loading state
    if (isLoading && data.length === 0) {
        return (
            <>
                {header}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#000" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </>
        );
    }

    // Handle error state
    if (isError && data.length === 0) {
        return (
            <>
                {header}
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                        Error loading items. Pull down to try again.
                    </Text>
                </View>
            </>
        );
    }

    // Handle empty state
    if (!data?.length || data.length === 0 || data === undefined || data === null) {
        return (
            <>
                {header}
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No items found.</Text>
                </View>
            </>
        );
    }

    const footerComponent = listProps.ListFooterComponent || renderFooter;

    return (
        <View style={styles.container}>
            <MasonryFlashList
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
                optimizeItemArrangement={true}
                overrideItemLayout={overrideItemLayout}
                contentContainerStyle={[styles.listContent, contentContainerStyle]}
                {...listProps}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: GAP_SIZE,
        paddingTop: GAP_SIZE,
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
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