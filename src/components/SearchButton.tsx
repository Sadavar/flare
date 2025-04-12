import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '@/context/ThemeContext';
import { CustomText } from './CustomText';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { DiscoverTabParamList } from '@/types';

export function SearchButton({ type }: { type: 'global' | 'friends' | 'brands' }) {
    const navigation = useNavigation<NavigationProp<DiscoverTabParamList>>();

    const styles = StyleSheet.create({
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 0.5,
            borderColor: '#000',
            borderRadius: 20,
            paddingHorizontal: 10,
            backgroundColor: theme.colors.light_background_1,
            margin: 15,
            paddingVertical: 5,
        },
        searchIcon: {
            marginRight: 10,
        },
        searchInput: {
            flex: 1,
            height: 40,
        },
    });

    const handleSearchPress = () => {
        if (type === 'global') {
            navigation.navigate('Search', {
                initialFilter: 'users',
            });
        } else if (type === 'friends') {
            navigation.navigate('Search', {
                initialFilter: 'users',
            });
        } else if (type === 'brands') {
            navigation.navigate('Search', {
                initialFilter: 'brands',
            });
        }
    };

    return (
        <TouchableOpacity onPress={handleSearchPress}>
            <View style={styles.searchContainer}>
                <MaterialIcons
                    name="search"
                    size={30}
                    color={theme.colors.light_background_2}
                    style={styles.searchIcon}
                />
                <CustomText style={{
                    fontSize: 16,
                    color: theme.colors.light_background_2
                }}>
                    Discover Brands
                </CustomText>
            </View>
        </TouchableOpacity>
    );
}