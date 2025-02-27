import { theme } from '@/context/ThemeContext';
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

type PostButtonProps = {
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    title?: string;
    style?: object;
}

export const PostButton = ({
    onPress,
    loading = false,
    disabled = false,
    title = "Add Post",
    style = {}
}: PostButtonProps) => {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                disabled && styles.buttonDisabled,
                style
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.buttonText}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: theme.colors.primary,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#ff8c9a',
        shadowOpacity: 0.1,
        elevation: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 1,
    },
});