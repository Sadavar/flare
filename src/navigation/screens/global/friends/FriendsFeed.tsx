import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFollowingFeed } from '@/hooks/usePostQueries';
import { useUserSearch } from '@/hooks/useUserSearch';
import { PaginatedGridList } from '@/components/PaginatedGridList';
import { PostView } from '@/components/PostView';
import debounce from 'lodash/debounce';
import { useSession } from '@/context/SessionContext';
import { theme, useTheme } from '@/context/ThemeContext';
import { CustomText } from '@/components/CustomText';

import { SearchButton } from '@/components/SearchButton';
import { Post } from '@/types';

function Header() {
    return (
        <>
            <View style={styles.fixedHeader}>
                {/* <CustomText style={styles.mainTitle}>Friends</CustomText> */}
                {/* <SearchButton type={'friends'} /> */}
            </View>
        </>
    )
}

export function FriendsFeed() {

    const {
        data: feedData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isFeedLoading,
        isError: isFeedError,
        refetch: refetchFeed
    } = useFollowingFeed();

    // Flatten posts from all pages
    const allPosts = feedData?.pages?.flat() || [];

    return (
        <PaginatedGridList
            data={allPosts}
            header={<Header />}
            renderItem={({ item }: { item: Post }) => <PostView post={item} />}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isLoading={isFeedLoading}
            isError={isFeedError}
            refetch={refetchFeed}
            emptyComponent={<CustomText style={styles.emptyText}>No following posts found, try following more people!</CustomText>}
            numColumns={1}
            keyExtractor={(item: Post) => item.uuid}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    fixedHeader: {
        zIndex: 1,
    },
    mainTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
}); 