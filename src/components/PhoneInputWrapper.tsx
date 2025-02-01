import React from 'react';
import PhoneInput, { PhoneInputProps } from 'react-native-phone-number-input';
import { StyleSheet } from 'react-native';

// Suppress the warning in development
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
    if (args[0]?.includes?.('defaultProps')) return;
    originalConsoleError(...args);
};

interface PhoneInputWrapperProps extends Partial<PhoneInputProps> {
    onChangeFormattedText?: (text: string) => void;
}

export const PhoneInputWrapper = React.forwardRef<PhoneInput, PhoneInputWrapperProps>((props, ref) => {
    return (
        <PhoneInput
            ref={ref}
            defaultCode="US"
            layout="first"
            withDarkTheme={false}
            withShadow={false}
            containerStyle={styles.phoneInputContainer}
            textContainerStyle={styles.phoneInputText}
            {...props}
        />
    );
});

const styles = StyleSheet.create({
    phoneInputContainer: {
        width: '100%',
        marginBottom: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        overflow: 'hidden',
    },
    phoneInputText: {
        paddingVertical: 0,
        borderLeftWidth: 1,
        borderLeftColor: '#ddd',
        backgroundColor: 'transparent',
    },
}); 