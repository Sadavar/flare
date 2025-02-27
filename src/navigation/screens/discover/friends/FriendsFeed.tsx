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

export function FriendsFeed() {
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const { username: currentUsername } = useSession();
    const { theme } = useTheme();

    const {
        data: feedData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isFeedLoading,
        isError: isFeedError,
        refetch: refetchFeed
    } = useFollowingFeed();

    const {
        data: searchResults = [],
        isLoading: isSearchLoading
    } = useUserSearch(searchQuery);

    // Debounce search to avoid too many requests
    const handleSearch = debounce((text: string) => {
        setSearchQuery(text);
    }, 300);

    const handleUserPress = useCallback((username: string) => {
        setIsSearching(false);
        setSearchQuery('');

        console.log('yuh')
        console.log(username, currentUsername)
        // If it's the current user's profile, navigate to Profile tab
        if (username === currentUsername) {
            console.log('same username')
            navigation.getParent()?.navigate('Profile', {
                screen: 'ProfileMain'
            });
        } else {
            // Otherwise navigate to UserProfile in Discover stack
            navigation.navigate('UserProfile', { username });
        }
    }, [navigation, currentUsername]);
    const renderSearchResults = () => (
        <View style={styles.searchResults}>
            {searchResults.map(user => (
                <TouchableOpacity
                    key={user.id}
                    style={styles.searchResult}
                    onPress={() => handleUserPress(user.username)}
                >
                    <MaterialIcons name="person" size={24} color="#666" />
                    <CustomText style={styles.searchResultText}>@{user.username}</CustomText>
                </TouchableOpacity>
            ))}
        </View>
    );

    // Flatten posts from all pages
    const allPosts = feedData?.pages?.flat() || [];

    return (
        <View style={styles.container}>
            <CustomText style={[styles.mainTitle, { color: theme.colors.text }]}>
                Discover Friends
            </CustomText>

            <View style={[styles.searchContainer, {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.searchBar,
            }]}>
                <MaterialIcons name="search" size={30} color={theme.colors.light_background_2} />
                <TextInput
                    style={[styles.searchInput, { color: theme.colors.text }]}
                    placeholder="Search users..."
                    placeholderTextColor={theme.colors.subtext}
                    onChangeText={(text) => {
                        handleSearch(text);
                        setIsSearching(!!text);
                    }}
                    onFocus={() => setIsSearching(true)}
                />
                {isSearching && (
                    <TouchableOpacity
                        onPress={() => {
                            setIsSearching(false);
                            setSearchQuery('');
                        }}
                    >
                        <MaterialIcons name="close" size={24} color={theme.colors.subtext} />
                    </TouchableOpacity>
                )}
            </View>

            {isSearching ? (
                renderSearchResults()
            ) : (
                <PaginatedGridList
                    data={allPosts}
                    renderItem={({ item }) => <PostView post={item} />}
                    fetchNextPage={fetchNextPage}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    isLoading={isFeedLoading}
                    isError={isFeedError}
                    refetch={refetchFeed}
                    emptyComponent={<CustomText style={styles.emptyText}>No following posts found, try following more people!</CustomText>}
                    numColumns={1}
                    keyExtractor={(item) => item.uuid}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mainTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: 'center',
        paddingTop: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 0.5,
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
    searchResults: {
        flex: 1,
        padding: 10,
    },
    searchResult: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchResultText: {
        marginLeft: 10,
        fontSize: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
}); 