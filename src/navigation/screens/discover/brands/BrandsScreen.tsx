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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MasonryList from '@react-native-seoul/masonry-list';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Brand, Post, Style } from '@/types';
import { POST_SELECT_QUERY, formatPost } from '@/hooks/usePostQueries';

function StyleSearch({ searchQuery, setSearchQuery }: {
    searchQuery: string;
    setSearchQuery: (text: string) => void;
}) {
    return (
        <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={30} color="#000" style={styles.searchIcon} />
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

    // Query for brands
    const { data: brands } = useQuery<Brand[]>({
        queryKey: ['brands'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('brands')
                .select('id, name')
                .order('name');
            if (error) throw error;
            return data.map(brand => ({
                id: brand.id,
                name: brand.name,
                x_coord: null,
                y_coord: null,
            }));
        },
    });

    // Query for styles
    const { data: stylesData, isLoading: stylesLoading } = useQuery<Style[]>({
        queryKey: ['styles'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('styles')
                .select('id, name')
                .order('name');
            if (error) throw error;
            return data;
        },
    });

    // Query for posts filtered by styles
    const { data: posts } = useQuery<Post[]>({
        queryKey: ['stylePosts', selectedStyles],
        queryFn: async () => {
            let query = supabase
                .from('posts')
                .select(POST_SELECT_QUERY)
                .order('created_at', { ascending: false });

            if (selectedStyles.length > 0) {
                // Get posts that have ANY of the selected styles
                const { data: styleFilteredPosts, error: styleError } = await supabase
                    .from('post_styles')
                    .select('post_uuid')
                    .in('style_id', selectedStyles);

                if (styleError) throw styleError;

                // Get unique post UUIDs
                const postUuids = [...new Set(styleFilteredPosts.map(post => post.post_uuid))];

                if (postUuids.length > 0) {
                    query = query.in('uuid', postUuids);
                } else {
                    return [];
                }
            }

            const { data, error } = await query;
            console.log('Query response:', { data, error });
            if (error) throw error;

            return data.map(formatPost);
        },
    });

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
            <Text style={styles.brandIcon}>{item.name.charAt(0)}</Text>
            <Text style={styles.brandName}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderContent = () => {
        if (searchQuery) {
            return (
                <FlatList
                    data={filteredStyles}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            key={item.id.toString()}
                            style={styles.suggestionItem}
                            onPress={() => {
                                setSelectedStyles([item.id]);
                                setSearchQuery('');
                            }}
                        >
                            <Text style={styles.suggestionText}>{item.name}</Text>
                        </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.id.toString()}
                />
            );
        } else {
            return (
                <MasonryList
                    ListHeaderComponent={
                        <View>
                            <Text style={styles.trendingTitle}>Trending Brands</Text>
                            <FlatList
                                horizontal
                                data={brands ? brands.slice(0, 10) : []}
                                renderItem={renderTrendingItem}
                                showsHorizontalScrollIndicator={false}
                                style={styles.carouselContainer}
                                keyExtractor={item => item.id.toString()}
                            />

                            <Text style={styles.trendingTitle}>Filter by Style</Text>
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
                                    <Text style={[
                                        styles.chipText,
                                        selectedStyles.length === 0 && styles.chipTextSelected
                                    ]}>All Styles</Text>
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
                                        <Text style={[
                                            styles.chipText,
                                            selectedStyles.includes(style.id) && styles.chipTextSelected
                                        ]}>{style.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    }
                    data={posts || []}
                    keyExtractor={(item: Post) => item.uuid}
                    numColumns={2}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.masonryContent}
                    renderItem={({ item, i }) => {
                        const post = item as Post;
                        const imageHeight = i % 3 === 0 ? 250 : i % 2 === 0 ? 200 : 300;

                        return (
                            <View style={[
                                styles.postContainer,
                                { marginLeft: i % 2 === 0 ? 0 : 8 }
                            ]}>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('PostDetails', { postId: post.uuid })}
                                >
                                    <Image
                                        source={{ uri: post.image_url }}
                                        style={[styles.postImage, { height: imageHeight }]}
                                        contentFit="cover"
                                    />
                                </TouchableOpacity>

                                {post.styles && (
                                    <View style={styles.stylesContainer}>
                                        <Text style={styles.stylesLabel}>Styles:</Text>
                                        <View style={styles.stylesList}>
                                            {post.styles.map((style) => (
                                                <View
                                                    key={style.id}
                                                    style={styles.styleChip}
                                                >
                                                    <Text style={styles.styleText}>{style.name}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    }}
                />
            );
        }
    };

    if (stylesLoading) {
        return (
            <View style={styles.container}>
                <Text>Loading styles...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.fixedHeader}>
                <Text style={styles.mainTitle}>Discover Styles</Text>
                <StyleSearch
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            </View>

            {renderContent()}

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#000',
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
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        marginHorizontal: 10,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
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
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    chipSelected: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    chipText: {
        fontSize: 14,
        color: '#666',
    },
    chipTextSelected: {
        color: '#fff',
    },
    masonryContent: {
        paddingHorizontal: 12,
    },
    postContainer: {
        marginBottom: 16,
        flex: 1,
    },
    postImage: {
        width: '100%',
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
    },
    stylesContainer: {
        marginTop: 8,
    },
    stylesLabel: {
        fontWeight: '600',
        color: '#333',
        fontSize: 12,
        marginBottom: 4,
    },
    stylesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    styleChip: {
        backgroundColor: '#e0e0e0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    styleText: {
        fontSize: 12,
        color: '#444',
    },
});