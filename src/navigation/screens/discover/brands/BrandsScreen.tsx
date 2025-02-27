import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Brand, Post } from '@/types';
import { useBrands, useStyles, useFilteredPostsByStyles } from '@/hooks/usePostQueries';
import { PaginatedGridList } from '@/components/PaginatedGridList';
import { CustomText } from '@/components/CustomText';
import { theme } from '@/context/ThemeContext';
import PostCard from '@/components/PostCard';

function StyleSearch({ searchQuery, setSearchQuery }: {
    searchQuery: string;
    setSearchQuery: (text: string) => void;
}) {
    return (
        <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={30} color={theme.colors.light_background_2} style={styles.searchIcon} />
            <TextInput
                style={styles.searchInput}
                placeholder="Search for styles"
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
            />
        </View>
    );
}


export function BrandsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();
    const PAGE_SIZE = 10;

    // Using the refactored hooks from usePostQueries
    const { data: brands } = useBrands();
    const { data: stylesData, isLoading: stylesLoading } = useStyles();

    // Use the refactored hook for filtered posts
    const {
        data: postsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: postsLoading,
        isError: postsError,
        refetch: refetchPosts
    } = useFilteredPostsByStyles(selectedStyles, PAGE_SIZE);

    console.log('[BrandsScreen] Posts data:', postsData);

    // Flatten posts data correctly for use with PaginatedGridList
    const flattenedPosts = postsData?.pages.flatMap(page => page.posts) || [];
    console.log('[BrandsScreen] Flattened posts:', flattenedPosts);

    const filteredStyles = stylesData?.filter(style =>
        style.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const handleStylePress = (styleId: number) => {
        setSelectedStyles(prev => {
            if (prev.includes(styleId)) {
                return prev.filter(id => id !== styleId);
            }
            return [...prev, styleId];
        });
    };

    const handleAllStylesPress = () => {
        setSelectedStyles([]);
    };

    const renderTrendingItem = ({ item }: { item: Brand }) => (
        <TouchableOpacity
            style={styles.trendingCard}
            onPress={() => navigation.navigate('BrandDetails', {
                brandId: item.id,
                brandName: item.name,
            })}
        >
            <CustomText style={styles.brandIcon}>{item.name.charAt(0)}</CustomText>
            <CustomText style={styles.brandName}>{item.name}</CustomText>
        </TouchableOpacity>
    );

    const renderPostItem = ({ item }: { item: Post }) => {
        return (
            <PostCard post={item} />
        )
    };

    // Header component for PaginatedGridList
    const renderHeader = () => {
        return (
            <View>
                <CustomText style={styles.mainTitle}>Discover Styles</CustomText>
                <StyleSearch
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />

                <CustomText style={styles.trendingTitle}>Trending Brands</CustomText>
                <FlatList
                    horizontal
                    data={brands ? brands.slice(0, 10) : []}
                    renderItem={renderTrendingItem}
                    showsHorizontalScrollIndicator={false}
                    style={styles.carouselContainer}
                    keyExtractor={item => item.id.toString()}
                />

                <CustomText style={styles.trendingTitle}>Filter by Style</CustomText>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipsContainer}
                    contentContainerStyle={styles.chipsContent}
                    keyboardShouldPersistTaps="always"
                >
                    <TouchableOpacity
                        style={[
                            styles.chip,
                            selectedStyles.length === 0 && styles.chipSelected
                        ]}
                        onPress={handleAllStylesPress}
                    >
                        <CustomText style={[
                            styles.chipText,
                            selectedStyles.length === 0 && styles.chipTextSelected
                        ]}>All Styles</CustomText>
                    </TouchableOpacity>

                    {stylesData?.map((style) => (
                        <TouchableOpacity
                            key={style.id}
                            style={[
                                styles.chip,
                                selectedStyles.includes(style.id) && styles.chipSelected
                            ]}
                            onPress={() => handleStylePress(style.id)}
                        >
                            <CustomText style={[
                                styles.chipText,
                                selectedStyles.includes(style.id) && styles.chipTextSelected
                            ]}>{style.name}</CustomText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    // Custom empty component
    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <CustomText style={styles.emptyText}>
                {selectedStyles.length > 0
                    ? "No posts found with the selected styles. Try selecting different styles."
                    : "No posts found."}
            </CustomText>
        </View>
    );

    // Custom error component
    const renderErrorComponent = () => (
        <View style={styles.errorContainer}>
            <CustomText style={styles.errorText}>
                Error loading posts. Pull down to try again.
            </CustomText>
        </View>
    );


    if (stylesLoading) {
        return (
            <View style={styles.container}>
                <CustomText>Loading styles...</CustomText>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {searchQuery ? (
                // Show search results
                <FlatList
                    data={filteredStyles}
                    ListHeaderComponent={() => (
                        <View style={styles.fixedHeader}>
                            <CustomText style={styles.mainTitle}>Discover Styles</CustomText>
                            <StyleSearch
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                            />
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            key={item.id.toString()}
                            style={styles.suggestionItem}
                            onPress={() => {
                                setSelectedStyles([item.id]);
                                setSearchQuery('');
                            }}
                        >
                            <CustomText style={styles.suggestionText}>{item.name}</CustomText>
                        </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.id.toString()}
                />
            ) : (
                // Show paginated grid view for posts
                <PaginatedGridList
                    data={flattenedPosts}
                    header={renderHeader()}
                    renderItem={renderPostItem}
                    fetchNextPage={fetchNextPage}
                    hasNextPage={!!hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    isLoading={postsLoading}
                    isError={postsError}
                    refetch={refetchPosts}
                    keyExtractor={(item: Post) => item.uuid}
                    numColumns={2}
                    estimatedItemSize={280}
                    // emptyComponent={renderEmptyComponent()}
                    // errorComponent={renderErrorComponent()}
                    loadingMoreText="Loading more posts..."
                    contentContainerStyle={styles.gridContent}
                />
            )}
        </KeyboardAvoidingView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        marginVertical: 8,
    },
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
    trendingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 20,
        marginTop: 10,
    },
    carouselContainer: {
        marginTop: 10,
        marginBottom: 25,
    },
    trendingCard: {
        width: 130,
        height: 130,
        backgroundColor: theme.colors.light_background_1,
        borderRadius: 10,
        marginHorizontal: 10,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.9,
        shadowRadius: 7,
        elevation: 2,
    },
    brandIcon: {
        fontSize: 40,
        fontWeight: 'bold',
    },
    brandName: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 5,
    },
    suggestionItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    suggestionText: {
        fontSize: 16,
    },
    chipsContainer: {
        marginVertical: 12,
    },
    chipsContent: {
        paddingHorizontal: 12,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: theme.colors.light_background_1,
    },
    chipSelected: {
        backgroundColor: 'black',
        borderColor: '#000',
    },
    chipText: {
        fontSize: 14,
    },
    chipTextSelected: {
        color: '#fff',
    },
    gridContent: {
        paddingHorizontal: 12,
    },
    postContainer: {
        marginBottom: 16,
        flex: 1,
        marginHorizontal: 6,
    },
    postImage: {
        width: '100%',
        aspectRatio: 0.75, // 3:4 aspect ratio (width:height)
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
    },
    stylesContainer: {
        marginTop: 8,
    },
    stylesLabel: {
        fontWeight: '600',
        fontSize: 12,
        marginBottom: 4,
    },
    stylesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    styleChip: {
        backgroundColor: theme.colors.light_background_2,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    styleText: {
        fontSize: 12,
    },
    emptyContainer: {
        paddingTop: 50,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    errorContainer: {
        paddingTop: 50,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#e53935',
        textAlign: 'center',
    },
});