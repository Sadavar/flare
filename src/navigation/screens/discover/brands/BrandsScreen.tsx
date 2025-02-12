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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MasonryList from '@react-native-seoul/masonry-list';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';

interface Brand {
    id: number;
    name: string;
}

interface Post {
    uuid: string;
    image_url: string;
    description: string;
    user: {
        username: string;
    };
    brands: Brand[];
}

function BrandSearch({ searchQuery, setSearchQuery }: {
    searchQuery: string;
    setSearchQuery: (text: string) => void;
}) {
    return (
        <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={30} color="#000" style={styles.searchIcon} />
            <TextInput
                style={styles.searchInput}
                placeholder="Search for brands"
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
    const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: brands, isLoading: brandsLoading } = useQuery<Brand[]>({
        queryKey: ['brands'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('brands')
                .select('id, name')
                .order('name');
            if (error) throw error;
            return data;
        },
    });

    const { data: posts } = useQuery<Post[]>({
        queryKey: ['brandPosts', selectedBrands],
        queryFn: async () => {
            let query = supabase
                .from('posts')
                .select(`
                    uuid,
                    image_url,
                    description,
                    profiles!posts_user_uuid_fkey (username),
                    post_brands!inner (
                        brands!inner (
                            id,
                            name
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (selectedBrands.length > 0) {
                query = query.in('post_brands.brands.id', selectedBrands);
            }

            const { data, error } = await query;
            if (error) throw error;

            return data.map(post => ({
                uuid: post.uuid,
                image_url: supabase.storage
                    .from('outfits')
                    .getPublicUrl(post.image_url).data.publicUrl,
                description: post.description,
                user: {
                    username: post.profiles?.username
                },
                brands: post.post_brands.map((pb: any) => ({
                    id: pb.brands.id,
                    name: pb.brands.name
                }))
            }));
        },
    });

    const filteredBrands = brands?.filter(brand =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const handleBrandPress = (brandId: number) => {
        setSelectedBrands(prev => {
            if (prev.includes(brandId)) {
                return prev.filter(id => id !== brandId);
            }
            return [...prev, brandId];
        });
    };

    const handleAllBrandsPress = () => {
        setSelectedBrands([]);
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
                    data={filteredBrands}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            key={item.id.toString()}
                            style={styles.suggestionItem}
                            onPress={() => {
                                navigation.navigate('BrandDetails', {
                                    brandId: item.id,
                                    brandName: item.name,
                                });
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
                <>
                    <MasonryList
                        ListHeaderComponent={
                            <View>
                                <Text style={styles.trendingTitle}>Trending Brands</Text>
                                <FlatList
                                    horizontal
                                    data={brands?.slice(0, 10)}
                                    renderItem={renderTrendingItem}
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.carouselContainer}
                                    keyExtractor={item => item.id.toString()}
                                />

                                <Text style={styles.trendingTitle}>All Brands</Text>
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
                                            selectedBrands.length === 0 && styles.chipSelected
                                        ]}
                                        onPress={handleAllBrandsPress}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            selectedBrands.length === 0 && styles.chipTextSelected
                                        ]}>All Brands</Text>
                                    </TouchableOpacity>

                                    {brands?.map((brand) => (
                                        <TouchableOpacity
                                            key={brand.id}
                                            style={[
                                                styles.chip,
                                                selectedBrands.includes(brand.id) && styles.chipSelected
                                            ]}
                                            onPress={() => handleBrandPress(brand.id)}
                                        >
                                            <Text style={[
                                                styles.chipText,
                                                selectedBrands.includes(brand.id) && styles.chipTextSelected
                                            ]}>{brand.name}</Text>
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

                                    {post.brands?.length > 0 && (
                                        <View style={styles.brandsContainer}>
                                            <Text style={styles.brandsLabel}>Featured Brands:</Text>
                                            <View style={styles.brandsList}>
                                                {post.brands.map((brand) => (
                                                    <TouchableOpacity
                                                        key={brand.id}
                                                        style={styles.brandButton}
                                                        onPress={() => navigation.navigate('BrandDetails', {
                                                            brandId: brand.id,
                                                            brandName: brand.name
                                                        })}
                                                    >
                                                        <Text style={styles.brandText}>{brand.name}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        }}
                    />
                </>
            );
        }
    };

    if (brandsLoading) {
        return (
            <View style={styles.container}>
                <Text>Loading brands...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.fixedHeader}>
                <Text style={styles.mainTitle}>Discover Brands</Text>
                <BrandSearch
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
    suggestionsList: {
        flex: 1,
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
    brandsContainer: {
        marginTop: 8,
    },
    brandsLabel: {
        fontWeight: '600',
        color: '#333',
        fontSize: 12,
        marginBottom: 4,
    },
    brandsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    brandButton: {
        backgroundColor: '#e0e0e0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    brandText: {
        fontSize: 12,
        color: '#444',
    },
});