import React, { useState, useRef } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import PhoneInput from 'react-native-phone-number-input';
import { parsePhoneNumberWithError } from 'libphonenumber-js';
import { PhoneInputWrapper } from '@/components/PhoneInputWrapper';
import { Layout } from '@/components/Layout';
import { CustomText } from '@/components/CustomText';
import { theme } from '@/context/ThemeContext';

export function Login() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [formattedPhoneNumber, setFormattedPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const phoneInput = useRef<PhoneInput>(null);

    const sendVerificationCode = async () => {
        if (!phoneNumber) {
            return Alert.alert('Error', 'Please enter your phone number');
        }

        const isValid = phoneInput.current?.isValidNumber(phoneNumber);
        if (!isValid) {
            return Alert.alert('Error', 'Please enter a valid phone number');
        }

        setLoading(true);

        try {
            // Get the raw number with country code
            const parsedNumber = parsePhoneNumberWithError(formattedPhoneNumber);
            // Format to E.164 format (e.g., +14155552671)
            const e164Number = parsedNumber.format('E.164');

            console.log('Sending code to:', e164Number); // For debugging

            const { error } = await supabase.auth.signInWithOtp({
                phone: e164Number,
            });

            if (error) throw error;

            setShowVerification(true);
            Alert.alert('Success', 'Verification code sent to your phone');
        } catch (error: any) {
            console.log('Error:', error);
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = async () => {
        if (!verificationCode) {
            return Alert.alert('Error', 'Please enter the verification code');
        }

        if (!/^\d{6}$/.test(verificationCode)) {
            return Alert.alert('Error', 'Please enter a valid 6-digit code');
        }

        setLoading(true);

        try {
            const parsedNumber = parsePhoneNumberWithError(formattedPhoneNumber);
            const e164Number = parsedNumber.format('E.164');

            console.log('Verifying code for:', e164Number); // For debugging

            const { error } = await supabase.auth.verifyOtp({
                phone: e164Number,
                token: verificationCode,
                type: 'sms',
            });

            if (error) throw error;
        } catch (error: any) {
            console.log('Error:', error);
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <View style={styles.container}>
                <View style={styles.content}>
                    <CustomText style={styles.title}>Welcome to Flare</CustomText>
                    {!showVerification ? (
                        <>
                            <CustomText style={styles.subtitle}>Enter your phone number to continue</CustomText>
                            <PhoneInputWrapper
                                ref={phoneInput}
                                defaultValue={phoneNumber}
                                onChangeText={setPhoneNumber}
                                onChangeFormattedText={setFormattedPhoneNumber}
                                autoFocus
                            />
                            <TouchableOpacity
                                style={styles.button}
                                onPress={sendVerificationCode}
                                disabled={loading}
                            >
                                <CustomText style={styles.buttonText}>Send Code</CustomText>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <CustomText style={styles.subtitle}>Enter the verification code</CustomText>
                            <TextInput
                                style={styles.input}
                                placeholder="6-digit code"
                                value={verificationCode}
                                onChangeText={setVerificationCode}
                                keyboardType="number-pad"
                                maxLength={6}
                                autoFocus
                            />
                            <TouchableOpacity
                                style={styles.button}
                                onPress={verifyCode}
                                disabled={loading}
                            >
                                <CustomText style={styles.buttonText}>Verify</CustomText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => setShowVerification(false)}
                            >
                                <CustomText style={styles.backButtonText}>Back</CustomText>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        color: theme.colors.light_background_3,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.light_background_1,
        padding: 15,
        marginBottom: 20,
        borderRadius: 8,
        fontSize: 16,
        color: theme.colors.text,
    },
    button: {
        backgroundColor: theme.colors.primary,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    backButton: {
        marginTop: 10,
        alignItems: 'center',
    },
    backButtonText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
}); 