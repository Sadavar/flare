import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '@/context/ThemeContext';

interface SkeletonProps {
    width: number | string;
    height: number;
    style?: any;
}

export function SkeletonLoader({ width, height, style }: SkeletonProps) {
    const animatedValue = new Animated.Value(0);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, opacity },
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: theme.colors.light_background_1,
        borderRadius: 8,
    },
}); 