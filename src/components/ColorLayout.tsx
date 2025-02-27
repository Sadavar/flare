import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { theme } from '@/context/ThemeContext';
import { Background } from '@react-navigation/elements';

interface LayoutProps {
    children: React.ReactNode;
}

export function BaseColorLayout({ children }: LayoutProps) {
    const baseColorStyles = {
        backgroundColor: theme.colors.background,
        color: theme.colors.text
    }
    return (
        <View style={
            baseColorStyles
        }>
            {children}
        </View>
    );
}