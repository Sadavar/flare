import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BrandsStackParamList } from '@/navigation/types';
import { Layout } from '@/components/Layout';

interface Brand {
    id: number;
    name: string;
    post_count: number;
}

type BrandsListNavigationProp = NativeStackNavigationProp<BrandsStackParamList, 'BrandsList'>;

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
        <Layout>
            <View style={styles.container}>
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
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        padding: 20,
    },
    brandItem: {
        padding: 15,
        backgroundColor: '#fff',
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