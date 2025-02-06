import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BrandsStackParamList } from '@/navigation/types';
import { TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
// import Carousel from 'react-native-snap-carousel'
// import Carousel from "react-native-reanimated-carousel";
// import { useSharedValue } from "react-native-reanimated";

interface Brand {
    id: number;
    name: string;
    post_count: number;
}

type BrandsListNavigationProp = NativeStackNavigationProp<BrandsStackParamList, 'BrandsList'>;

function BrandSearch() {
    const styles = StyleSheet.create({
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
    });
    return (
        // Search input
        <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={30} color="#000" style={styles.searchIcon} />
            <TextInput
                style={styles.searchInput}
                placeholder="Search for brands"
                placeholderTextColor="#666"
            />
        </View>
    );
}

function TrendingBrandsCarousel() {
    const [brands, setBrands] = useState<Brand[]>([
        {
            id: 1,
            name: "Fugazi",
            post_count: 10,
        },
        {
            id: 2,
            name: "MadHappy",
            post_count: 15,
        },
        {
            id: 3,
            name: "Nike",
            post_count: 20,
        },
        {
            id: 4,
            name: "Adidas",
            post_count: 12,
        },
    ]);

    const navigation = useNavigation<BrandsListNavigationProp>();

    const styles = StyleSheet.create({
        carouselContainer: {
            marginTop: 10,
            height: '25%',
            flexGrow: 0
        },
        card: {
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
            marginTop: 10,
            textAlign: 'center',
        },
        postCount: {
            fontSize: 12,
            color: '#666',
            marginTop: 5,
        },
    });

    return (
        <ScrollView horizontal style={styles.carouselContainer}>
            {brands.map((brand) => (
                <TouchableOpacity
                    key={brand.id}
                    style={styles.card}
                    onPress={() => navigation.navigate('BrandDetails', {
                        brandId: brand.id,
                        brandName: brand.name,
                    })}
                >
                    <Text style={styles.brandIcon}>{brand.name.charAt(0)}</Text>
                    <Text style={styles.brandName}>{brand.name}</Text>
                    <Text style={styles.postCount}>{brand.post_count} posts</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

export function BrandsList() {
    const navigation = useNavigation<BrandsListNavigationProp>();

    const { data: brands, isLoading } = useQuery({
        queryKey: ['brands'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('brands')
                .select(`
                    id,
                    name,
                    post_brands (
                        count
                    )
                `)
                .order('name');

            if (error) throw error;

            return data.map(brand => ({
                id: brand.id,
                name: brand.name,
                post_count: brand.post_brands.length
            }));
        },
    });

    const renderBrand = ({ item }: { item: Brand }) => (
        <TouchableOpacity
            style={styles.brandItem}
            onPress={() => navigation.navigate('BrandDetails', {
                brandId: item.id,
                brandName: item.name
            })}
        >
            <Text style={styles.brandName}>{item.name}</Text>
            <Text style={styles.postCount}>{item.post_count} posts</Text>
        </TouchableOpacity>
    );



    return (
        <View style={styles.container}>
            <Text style={styles.mainTitle}>Discover Brands</Text>
            <BrandSearch />
            <Text style={styles.trendingTitle}>Trending Brands</Text>
            <TrendingBrandsCarousel />
            <Text style={styles.title}>Brands</Text>
            {isLoading ? (
                <Text>Loading...</Text>
            ) : !brands?.length ? (
                <Text>No brands yet</Text>
            ) : (
                <FlashList
                    data={brands}
                    renderItem={renderBrand}
                    estimatedItemSize={60}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 10
    },
    mainTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        paddingTop: 0,
        alignSelf: 'center',
    },
    trendingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        paddingTop: 0,
        marginLeft: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        padding: 20,
    },
    brandItem: {
        padding: 15,
    },
    brandName: {
        fontSize: 16,
        fontWeight: '600',
    },
    postCount: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#ddd',
        marginLeft: 15,
    },
});
