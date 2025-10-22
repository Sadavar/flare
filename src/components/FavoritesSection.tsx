import React from 'react';
import { View, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getFavoritesForUser } from '@/lib/favorites';
import { CustomText } from '@/components/CustomText';

export default function FavoritesSection({ userId }: { userId: string }) {
    const { data: favorites = [] } =
        useQuery({
            queryKey: ['favorites', userId],
            queryFn: async () => await getFavoritesForUser(userId),
            enabled: !!userId,
        });

    if (!favorites || favorites.length === 0) return null;

    return (
        <View style={{ padding: 16 }}>
            <CustomText style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Favorites</CustomText>
            <FlatList
                data={favorites}
                horizontal
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <View style={{ marginRight: 12, alignItems: 'center' }}>
                        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
                            <MaterialIcons name="store" size={24} color="#666" />
                        </View>
                        <CustomText style={{ marginTop: 8 }}>{item.name}</CustomText>
                    </View>
                )}
            />
        </View>
    );
}
