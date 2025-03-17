import React, { useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { theme } from '@/context/ThemeContext';

interface DotStreamProps {
    size?: number;
    color?: string;
    speed?: number;
}

export function DotStream({
    size = 60,
    color = theme.colors.primary,
    speed = 2.5
}: DotStreamProps) {
    const dotRefs = React.useRef([...Array(5)].map(() => ({
        scale: new Animated.Value(0),
        translateX: new Animated.Value(0)
    }))).current;

    const dotSize = size * 0.18;

    useEffect(() => {
        const animations = dotRefs.map((dot, index) => {
            const delay = -(speed * 1000 * 0.2 * index);

            return Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        Animated.sequence([
                            Animated.timing(dot.scale, {
                                toValue: 0,
                                duration: 0,
                                useNativeDriver: true
                            }),
                            Animated.timing(dot.scale, {
                                toValue: 1,
                                duration: speed * 500,
                                useNativeDriver: true
                            }),
                            Animated.timing(dot.scale, {
                                toValue: 0,
                                duration: speed * 500,
                                useNativeDriver: true
                            })
                        ]),
                        Animated.timing(dot.translateX, {
                            toValue: size,
                            duration: speed * 1000,
                            useNativeDriver: true
                        })
                    ]),
                    Animated.timing(dot.translateX, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true
                    })
                ])
            );
        });

        Animated.parallel(animations).start();

        return () => {
            animations.forEach(animation => animation.stop());
        };
    }, [size, speed, dotRefs]);

    return (
        <View style={[styles.container, { width: size, height: dotSize * 2 }]}>
            {dotRefs.map((dot, index) => (
                <Animated.View
                    key={index}
                    style={[
                        styles.dot,
                        {
                            width: dotSize,
                            height: dotSize,
                            backgroundColor: color,
                            transform: [
                                { translateX: dot.translateX },
                                { scale: dot.scale }
                            ]
                        }
                    ]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dot: {
        position: 'absolute',
        borderRadius: 999,
        left: 0,
    }
}); 