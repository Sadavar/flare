import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Color } from '@/types';
import { theme } from '@/context/ThemeContext';

interface ColorCardProps {
    color: Color;
    isSelected?: boolean;
    onPress?: () => void;
    size?: 'small' | 'normal';
}

export function ColorCard({ color, isSelected, onPress, size = 'normal' }: ColorCardProps) {
    const styles = createStyles(size);

    return (
        <TouchableOpacity
            style={styles.colorCard}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View
                style={[
                    styles.colorSquare,
                    { backgroundColor: color.hex_value }
                ]}
            >
                {isSelected && (
                    <View style={styles.checkmarkContainer}>
                        <MaterialIcons name="check-circle" size={24} color="white" />
                    </View>
                )}
            </View>
            <View style={styles.colorInfo}>
                <Text style={styles.colorName}>{color.name}</Text>
                <Text style={styles.colorHex}>{color.hex_value}</Text>
            </View>
        </TouchableOpacity>
    );
}

const createStyles = (size: 'small' | 'normal') => StyleSheet.create({
    colorCard: {
        width: size === 'normal' ? 100 : 80,
        height: size === 'normal' ? 120 : 100,
        borderRadius: 8,
        backgroundColor: theme.colors.light_background_1,
        shadowColor: '#000',
        shadowOffset: {
            width: 5,
            height: 2,
        },
        shadowOpacity: 0.9,
        shadowRadius: 4,
        elevation: 5,
        margin: 5,
    },
    colorSquare: {
        width: '100%',
        height: size === 'normal' ? 70 : 50,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        overflow: 'visible',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkContainer: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 12,
    },
    colorInfo: {
        padding: 8,
    },
    colorName: {
        fontSize: size === 'normal' ? 12 : 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        marginBottom: 4,
        color: theme.colors.light_background_3,
    },
    colorHex: {
        fontSize: size === 'normal' ? 11 : 9,
        color: theme.colors.light_background_2,
    },
});