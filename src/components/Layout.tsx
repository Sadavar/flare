import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const { theme } = useTheme();

    return (
        <SafeAreaView style={[
            styles.safe,
            styles.container,
            { backgroundColor: theme.colors.background }
        ]}>
            {children}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
});