import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ListRenderItem } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BrandsStackParamList } from '@/navigation/types';
import { TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FlatList } from 'react-native-gesture-handler';

const { width } = Dimensions.get("window");

interface Brand {
    id: number;
    name: string;
    post_count: number;
}

type BrandsListNavigationProp = NativeStackNavigationProp<BrandsStackParamList, 'BrandsList'>;

// Keep your existing BrandSearch component
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

export function BrandsScreen() {
    const navigation = useNavigation<BrandsListNavigationProp>();
    const [brands, setBrands] = useState<Brand[]>([
        { id: 1, name: "Fugazi", post_count: 10 },
        { id: 2, name: "MadHappy", post_count: 15 },
        { id: 3, name: "Nike", post_count: 20 },
        { id: 4, name: "Adidas", post_count: 12 },
        { id: 5, name: "Puma", post_count: 18 },
        { id: 6, name: "Reebok", post_count: 25 },
        { id: 7, name: "Vans", post_count: 8 },
        { id: 8, name: "Converse", post_count: 14 },
        { id: 9, name: "New Balance", post_count: 22 },
        { id: 10, name: "Under Armour", post_count: 9 },
        { id: 11, name: "ASICS", post_count: 16 },
        { id: 12, name: "Fila", post_count: 23 },
        { id: 13, name: "Champion", post_count: 7 },
        { id: 14, name: "Supreme", post_count: 13 },
        { id: 15, name: "Off-White", post_count: 21 },
        { id: 16, name: "Gucci", post_count: 6 },
        { id: 17, name: "Prada", post_count: 11 },
        { id: 18, name: "Balenciaga", post_count: 19 },
        { id: 19, name: "Versace", post_count: 24 },
        { id: 20, name: "Burberry", post_count: 5 },
    ]);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#fff',
        },
        mainTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            paddingTop: 10,
            alignSelf: 'center',
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
        gridCard: {
            width: width / 3 - 15,
            aspectRatio: 1,
            backgroundColor: '#f0f0f0',
            borderRadius: 10,
            padding: 10,
            alignItems: 'center',
            justifyContent: 'center',
            margin: 5,
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
        postCount: {
            fontSize: 12,
            color: '#666',
            marginTop: 4,
        },
        gridContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: 5,
        },
    });

    const renderTrendingBrands = () => (
        <FlatList
            horizontal
            data={brands.slice(0, 10)} // Show first 10 brands as trending
            showsHorizontalScrollIndicator={true}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.trendingCard}
                    onPress={() => navigation.navigate('BrandDetails', {
                        brandId: item.id,
                        brandName: item.name,
                    })}
                >
                    <Text style={styles.brandIcon}>{item.name.charAt(0)}</Text>
                    <Text style={styles.brandName}>{item.name}</Text>
                    <Text style={styles.postCount}>{item.post_count} posts</Text>
                </TouchableOpacity>
            )}
            style={styles.carouselContainer}
        />
    );

    const renderGridItem: ListRenderItem<Brand> = ({ item }) => (
        <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('BrandDetails', {
                brandId: item.id,
                brandName: item.name,
            })}
        >
            <Text style={styles.brandIcon}>{item.name.charAt(0)}</Text>
            <Text style={styles.brandName}>{item.name}</Text>
            <Text style={styles.postCount}>{item.post_count} posts</Text>
        </TouchableOpacity>
    );

    const ListHeader = () => (
        <>
            <Text style={styles.mainTitle}>Discover Brands</Text>
            <BrandSearch />
            <Text style={styles.trendingTitle}>Trending Brands</Text>
            {renderTrendingBrands()}
            <Text style={styles.trendingTitle}>All Brands</Text>
        </>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={brands}
                renderItem={renderGridItem}
                ListHeaderComponent={ListHeader}
                numColumns={3}
                columnWrapperStyle={{ justifyContent: 'flex-start' }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
}