import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/context/SessionContext';
import { Layout } from '@/components/Layout';

export function Username() {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useSession();

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
                    phone: user.phone,
                    updated_at: new Date(),
                });

            if (error) throw error;
        } catch (error: any) {
            Alert.alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <View style={styles.container}>
                <Text style={styles.title}>Choose a Username</Text>
                <Text style={styles.subtitle}>This will be your unique identifier in the app</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <Button
                    title="Continue"
                    onPress={setUserUsername}
                    disabled={loading}
                />
            </View>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        color: '#666',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 15,
        marginBottom: 20,
        borderRadius: 8,
        fontSize: 16,
    },
}); 