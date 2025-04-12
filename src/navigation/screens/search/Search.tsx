import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { DiscoverTabParamList } from '@/types';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useBrands, useStyles } from '@/hooks/usePostQueries';
import { CustomText } from '@/components/CustomText';
import { theme, useTheme } from '@/context/ThemeContext';
import debounce from 'lodash/debounce';
import { Layout } from '@/components/Layout';

export const Search = React.memo(() => {
    const route = useRoute<RouteProp<DiscoverTabParamList, 'Search'>>();
    const navigation = useNavigation<NavigationProp<DiscoverTabParamList>>();
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [inputValue, setInputValue] = useState('');
    const initialFilter = route.params?.initialFilter || 'brands';
    const [searchMode, setSearchMode] = useState<'users' | 'brands' | 'styles'>(initialFilter);

    const inputRef = useRef<TextInput | null>(null);

    // Add a useEffect to focus the input when the component mounts
    useEffect(() => {
        // Short timeout to ensure component is fully rendered
        const timer = setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    // Handler for back button
    const handleBackPress = () => {
        navigation.goBack();
    };

    useEffect(() => {
        setSearchMode(initialFilter);
    }, [initialFilter]);

    // Memoize search results
    const {
        data: userResults = [],
        isLoading: isUserLoading
    } = useUserSearch(searchMode === 'users' ? searchQuery : '');

    const {
        data: brandsData = [],
        isLoading: isBrandsLoading
    } = useBrands();

    const {
        data: stylesData = [],
        isLoading: isStylesLoading
    } = useStyles();

    // Memoize filtered results
    const filteredBrands = useMemo(() =>
        brandsData.filter(brand =>
            brand.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        [brandsData, searchQuery]
    );

    const filteredStyles = useMemo(() =>
        stylesData.filter(style =>
            style.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        [stylesData, searchQuery]
    );

    // Update your handleSearch function to focus the input
    const handleSearch = useCallback((type: 'users' | 'brands' | 'styles') => {
        setSearchMode(type);

        // Focus the input when changing filter
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 100);
    }, []);

    const handleUserPress = useCallback((username: string) => {
        navigation.navigate('Discover', {
            screen: 'UserProfile',
            params: { username },
        });
    }, [navigation]);

    const handleBrandPress = useCallback((brandId: number, brandName: string) => {
        navigation.navigate('Discover', {
            screen: 'BrandDetails',
            params: { brandId, brandName },
        });
    }, [navigation]);

    const debouncedSetSearchQuery = useMemo(
        () => debounce((text: string) => {
            setSearchQuery(text);
        }, 300),
        []
    );

    // Memoize UI components with back button
    const SearchInput = useMemo(() => (
        <View style={styles.searchRow}>
            <TouchableOpacity
                onPress={handleBackPress}
                style={styles.backButton}
            >
                <MaterialIcons
                    name="chevron-left"
                    size={30}
                    color={theme.colors.text}
                />
            </TouchableOpacity>

            <View style={[styles.searchContainer, {
                backgroundColor: theme.colors.light_background_1,
                borderColor: theme.colors.border
            }]}>
                <MaterialIcons name="search" size={24} color={theme.colors.subtext} style={styles.searchIcon} />
                <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder={`Search ${searchMode}...`}
                    placeholderTextColor={theme.colors.subtext}
                    value={inputValue}
                    onChangeText={(text) => {
                        setInputValue(text);
                        debouncedSetSearchQuery(text);
                    }}
                    autoCapitalize="none"
                    ref={inputRef}
                />
                {inputValue.length > 0 && (
                    <TouchableOpacity onPress={() => {
                        setInputValue('');
                        setSearchQuery('');
                    }}>
                        <MaterialIcons name="close" size={24} color={theme.colors.subtext} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    ), [inputValue, searchMode, theme.colors]);

    // Navigation handlers
    const handleStylePress = (styleId: number) => {
        navigation.navigate('Brands', {
            screen: 'BrandsScreen',
            params: { selectedStyle: styleId },
        });
    };

    // Render loading indicator
    const renderLoading = () => (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
    );

    // Render search results based on mode
    const renderSearchResults = () => {
        // Show loading indicator when fetching results
        if (
            (searchMode === 'users' && isUserLoading) ||
            (searchMode === 'brands' && isBrandsLoading) ||
            (searchMode === 'styles' && isStylesLoading)
        ) {
            return renderLoading();
        }

        // No results found
        if (
            (searchMode === 'users' && searchQuery && userResults.length === 0) ||
            (searchMode === 'brands' && searchQuery && filteredBrands.length === 0) ||
            (searchMode === 'styles' && searchQuery && filteredStyles.length === 0)
        ) {
            return (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="search-off" size={48} color={theme.colors.subtext} />
                    <CustomText style={styles.emptyText}>No {searchMode} found</CustomText>
                </View>
            );
        }

        // User results
        if (searchMode === 'users') {
            return (
                <ScrollView style={styles.resultsContainer}>
                    {userResults.map(user => (
                        <TouchableOpacity
                            key={user.id}
                            style={styles.resultItem}
                            onPress={() => handleUserPress(user.username)}
                        >
                            <View style={styles.userIconContainer}>
                                <MaterialIcons name="person" size={24} color={theme.colors.text} />
                            </View>
                            <View style={styles.resultTextContainer}>
                                <CustomText style={styles.resultMainText}>@{user.username}</CustomText>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={theme.colors.subtext} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            );
        }

        // Brand results
        if (searchMode === 'brands') {
            return (
                <ScrollView style={styles.resultsContainer}>
                    {filteredBrands.map(brand => (
                        <TouchableOpacity
                            key={brand.id}
                            style={styles.resultItem}
                            onPress={() => handleBrandPress(brand.id, brand.name)}
                        >
                            <View style={[styles.userIconContainer, styles.brandIcon]}>
                                <CustomText style={styles.brandIconText}>{brand.name.charAt(0)}</CustomText>
                            </View>
                            <View style={styles.resultTextContainer}>
                                <CustomText style={styles.resultMainText}>{brand.name}</CustomText>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={theme.colors.subtext} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            );
        }

        // Style results
        if (searchMode === 'styles') {
            return (
                <ScrollView style={styles.resultsContainer}>
                    {filteredStyles.map(style => (
                        <TouchableOpacity
                            key={style.id}
                            style={styles.resultItem}
                            onPress={() => handleStylePress(style.id)}
                        >
                            <View style={[styles.userIconContainer, { backgroundColor: theme.colors.light_background_2 }]}>
                                <MaterialIcons name="style" size={24} color={theme.colors.text} />
                            </View>
                            <View style={styles.resultTextContainer}>
                                <CustomText style={styles.resultMainText}>{style.name}</CustomText>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={theme.colors.subtext} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            );
        }

        return null;
    };

    return (
        <Layout>
            <View style={styles.container}>
                {/* <View style={styles.fixedHeader}>
                    <CustomText style={styles.mainTitle}>
                        Search
                    </CustomText>
                </View> */}

                {SearchInput}

                <View style={styles.filterContainer}>
                    <TouchableOpacity
                        onPress={() => handleSearch('brands')}
                        style={[
                            styles.filter,
                            searchMode === 'brands' ?
                                { backgroundColor: theme.colors.primary } :
                                { backgroundColor: theme.colors.light_background_1 }
                        ]}
                    >
                        <MaterialIcons
                            name="local-mall"
                            size={20}
                            color={searchMode === 'brands' ? '#fff' : theme.colors.text}
                        />
                        <CustomText style={[
                            styles.filterText,
                            { color: searchMode === 'brands' ? '#fff' : theme.colors.text }
                        ]}>
                            Brands
                        </CustomText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleSearch('users')}
                        style={[
                            styles.filter,
                            searchMode === 'users' ?
                                { backgroundColor: theme.colors.primary } :
                                { backgroundColor: theme.colors.light_background_1 }
                        ]}
                    >
                        <MaterialIcons
                            name="person"
                            size={20}
                            color={searchMode === 'users' ? '#fff' : theme.colors.text}
                        />
                        <CustomText style={[
                            styles.filterText,
                            { color: searchMode === 'users' ? '#fff' : theme.colors.text }
                        ]}>
                            Users
                        </CustomText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleSearch('styles')}
                        style={[
                            styles.filter,
                            searchMode === 'styles' ?
                                { backgroundColor: theme.colors.primary } :
                                { backgroundColor: theme.colors.light_background_1 }
                        ]}
                    >
                        <MaterialIcons
                            name="style"
                            size={20}
                            color={searchMode === 'styles' ? '#fff' : theme.colors.text}
                        />
                        <CustomText style={[
                            styles.filterText,
                            { color: searchMode === 'styles' ? '#fff' : theme.colors.text }
                        ]}>
                            Styles
                        </CustomText>
                    </TouchableOpacity>
                </View>

                {renderSearchResults()}
            </View>
        </Layout>
    );
});

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
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        marginVertical: 12,
    },
    backButton: {
        paddingHorizontal: 4,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 0.5,
        borderRadius: 20,
        paddingHorizontal: 10,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 8,
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    filter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 20,
        marginHorizontal: 4,
    },
    filterText: {
        marginLeft: 4,
        fontWeight: '500',
    },
    resultsContainer: {
        flex: 1,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.light_background_1,
    },
    userIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eee',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    brandIcon: {
        backgroundColor: '#f0f0f0',
    },
    brandIconText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.background
    },
    resultTextContainer: {
        flex: 1,
    },
    resultMainText: {
        fontSize: 16,
        fontWeight: '500',
    },
    resultSubText: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
        textAlign: 'center',
    }
});