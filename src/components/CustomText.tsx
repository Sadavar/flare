import React from 'react';
import { Text, TextProps } from 'react-native';
import { theme } from '@/context/ThemeContext';

interface CustomTextProps extends TextProps {
    children: React.ReactNode;
}

export function CustomText({ style, children, ...props }: CustomTextProps) {
    return (
        <Text
            style={[
                { color: theme.colors.text },
                style
            ]}
            {...props}
        >
            {children}
        </Text>
    );
}
