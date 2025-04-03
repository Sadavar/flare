import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    ScrollView,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Brand, Post, Style } from '@/types';
import { useBrands, useStyles, useFilteredPostsByStyles } from '@/hooks/usePostQueries';
import { PaginatedGridList } from '@/components/PaginatedGridList';
import { CustomText } from '@/components/CustomText';
import { theme } from '@/context/ThemeContext';
import PostCard from '@/components/PostCard';
import { SearchButton } from '@/components/SearchButton';

// Memoize the post item to prevent unnecessary re-renders
const MemoizedPostCard = memo(PostCard);

// Memoize the trending item component
const TrendingItem = memo(({ item, onPress }: { item: Brand, onPress: () => void }) => (
    <TouchableOpacity
        style={styles.trendingCard}
        onPress={onPress}
    >
        <CustomText style={styles.brandIcon}>{item.name.charAt(0)}</CustomText>
        <CustomText style={styles.brandName}>{item.name}</CustomText>
    </TouchableOpacity>
));

// Memoize the filter chip component
const FilterChip = memo(({ label, isSelected, onPress }: { label: string, isSelected: boolean, onPress: () => void }) => (
    <TouchableOpacity
        style={[
            styles.chip,
            isSelected && styles.chipSelected
        ]}
        onPress={onPress}
    >
        <CustomText style={[
            styles.chipText,
            isSelected && styles.chipTextSelected
        ]}>{label}</CustomText>
    </TouchableOpacity>
));

// Memoized Header Component
const Header = memo(({
    brands,
    stylesData,
    selectedStyles,
    onStylePress,
    onAllStylesPress,
    navigation
}) => {
    const trendingBrands = useMemo(() => brands ? brands.slice(0, 10) : [], [brands]);

    const renderTrendingItem = useCallback(({ item }: { item: Brand }) => (
        <TrendingItem
            item={item}
            onPress={() => navigation.navigate('BrandDetails', {
                brandId: item.id,
                brandName: item.name,
            })}
        />
    ), [navigation]);

    return (
        <View style={styles.fixedHeader}>
            <CustomText style={styles.mainTitle}>Discover Brands</CustomText>
            <SearchButton type={'brands'} />

            <CustomText style={styles.trendingTitle}>Trending Brands</CustomText>
            <FlatList
                horizontal
                data={trendingBrands}
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
                <FilterChip
                    label="All Styles"
                    isSelected={selectedStyles.length === 0}
                    onPress={onAllStylesPress}
                />

                {stylesData?.map((style: Style) => (
                    <FilterChip
                        key={style.id}
                        label={style.name}
                        isSelected={selectedStyles.includes(style.id)}
                        onPress={() => onStylePress(style.id)}
                    />
                ))}
            </ScrollView>
        </View>
    );
});

export function BrandsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
    const PAGE_SIZE = 10;

    const route = useRoute();
    console.log("route.params", route.params);
    const { selectedStyle } = route.params ? (route.params as { selectedStyle?: number | undefined }) : {};

    useEffect(() => {
        if (selectedStyle !== undefined) {
            setSelectedStyles([selectedStyle]);
        }
    }, [selectedStyle]);

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

    // Memoize flattened posts to prevent unnecessary recalculations
    const flattenedPosts = useMemo(() =>
        postsData?.pages.flatMap(page => page.posts) || [],
        [postsData]
    );

    const handleStylePress = useCallback((styleId: number) => {
        setSelectedStyles(prev => {
            if (prev.includes(styleId)) {
                return prev.filter(id => id !== styleId);
            }
            return [...prev, styleId];
        });
    }, []);

    const handleAllStylesPress = useCallback(() => {
        setSelectedStyles([]);
    }, []);

    const renderPostItem = useCallback(({ item }: { item: Post }) => {
        return <MemoizedPostCard post={item} />;
    }, []);

    const headerComponent = useMemo(() => (
        <Header
            brands={brands || []}
            stylesData={stylesData || []}
            selectedStyles={selectedStyles}
            onStylePress={handleStylePress}
            onAllStylesPress={handleAllStylesPress}
            navigation={navigation}
        />
    ), [brands, stylesData, selectedStyles, handleStylePress, handleAllStylesPress, navigation]);

    if (stylesLoading) {
        return (
            <View style={styles.container}>
                <CustomText>Loading styles...</CustomText>
            </View>
        );
    }

    return (
        <ScrollView>
            {headerComponent}
            <PaginatedGridList
                data={flattenedPosts}
                // header={headerComponent}
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
                loadingMoreText="Loading more posts..."
                contentContainerStyle={styles.gridContent}
            />
        </ScrollView>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 0
    },
    fixedHeader: {
        paddingTop: 15,
        zIndex: 1,
    },
    mainTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: 'center',
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
        backgroundColor: theme.colors.primary,
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