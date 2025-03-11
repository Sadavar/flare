import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/context/SessionContext';
import { Layout } from '@/components/Layout';
import { CustomText } from '@/components/CustomText';
import { theme } from '@/context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';

type UsernameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Username'>;

export function Username() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useSession();
    const navigation = useNavigation<UsernameScreenNavigationProp>();

    const setUserUsername = async () => {
        if (!username) return Alert.alert('Please enter a username');
        setLoading(true);

        try {
            // First check if username is already taken
            const { data: existingUser, error: checkError } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .single();

            if (checkError && checkError.code !== 'PGRST116') throw checkError;
            if (existingUser) {
                Alert.alert('Username already taken');
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: username,
                    updated_at: new Date(),
                });

            if (error) throw error;

            // Navigate to Main screen after successful username set
            navigation.replace('Main', {
                screen: 'Discover',
                params: undefined
            });

        } catch (error: any) {
            Alert.alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <View style={styles.container}>
                <CustomText style={styles.title}>Choose a Username</CustomText>
                <CustomText style={styles.subtitle}>This will be your unique identifier in the app</CustomText>
                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <TouchableOpacity
                    style={styles.button}
                    onPress={setUserUsername}
                    disabled={loading}
                >
                    <CustomText style={styles.buttonText}>Continue</CustomText>
                </TouchableOpacity>
            </View>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: theme.colors.background,
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
}); 