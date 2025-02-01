import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Layout } from '@/components/Layout';

export function Friends() {
    console.log('Rendering Friends component');
    return (
        <View style={styles.container} testID="friends-screen">
            <Text style={styles.text}>Friends Feed Coming Soon</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
    },
    text: {
        fontSize: 16,
        color: '#000',
    },
}); 