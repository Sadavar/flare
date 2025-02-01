import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LayoutProps {
    children: React.ReactNode;
    style?: any;
}

export function Layout({ children, style }: LayoutProps) {
    return (
        <SafeAreaView style={[styles.safe, style]} edges={['top']}>
            <View style={styles.container}>
                {children}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: 'white',
    },
    container: {
        flex: 1,
    },
});