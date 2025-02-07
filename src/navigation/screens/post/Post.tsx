import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, TextInput, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/context/SessionContext';
import { decode } from 'base64-arraybuffer';
import uuid from 'react-native-uuid';
import type { RouteProp } from '@react-navigation/native';
import type { MainTabParamList } from '@/navigation/types';
import { Layout } from '@/components/Layout';

type PostScreenRouteProp = RouteProp<MainTabParamList, 'Post'>;

export function Post() {
    const route = useRoute<PostScreenRouteProp>();
    const [image, setImage] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [brandsInput, setBrandsInput] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const { user } = useSession();

    useEffect(() => {
        // Set image from navigation params if available
        if (route.params?.image) {
            setImage(route.params.image);
        }
    }, [route.params?.image]);

    const uploadPost = async () => {
        if (!image || !user) return;
        setLoading(true);

        try {
            const file_id = uuid.v4().toString();
            const fileName = `outfits/${user.id}/${file_id}.jpg`;

            const base64 = await fetch(image)
                .then(res => res.blob())
                .then(blob => new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                }));

            const { error: uploadError } = await supabase.storage
                .from('outfits')
                .upload(fileName, decode(base64.split(',')[1]), {
                    contentType: 'image/jpeg'
                });

            if (uploadError) throw uploadError;

            const { data: postData, error: postError } = await supabase
                .from('posts')
                .insert([{
                    image_url: fileName,
                    description,
                    user_uuid: user.id,
                }])
                .select('uuid')
                .single();

            if (postError) throw postError;

            const brands = brandsInput
                .split(',')
                .map(brand => brand.trim())
                .filter(brand => brand.length > 0);

            for (const brandName of brands) {
                const { data: brandData, error: brandError } = await supabase
                    .from('brands')
                    .upsert([{ name: brandName }], { onConflict: 'name' })
                    .select('id')
                    .single();

                if (brandError) throw brandError;

                await supabase
                    .from('post_brands')
                    .insert([{
                        post_uuid: postData.uuid,
                        brand_id: brandData.id,
                    }]);
            }

            navigation.navigate('Profile' as never);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} >
            <View style={styles.container}>
                {image ? (
                    <>
                        <Text style={styles.trendingTitle}>Image Preview</Text>
                        <Image
                            source={{ uri: image }}
                            style={styles.image}
                            contentFit="cover"
                        />
                        <Text style={styles.trendingTitle}>Description</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Add a description..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />
                        <Text style={styles.trendingTitle}>Brands</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Add brands (comma separated)"
                            value={brandsInput}
                            onChangeText={setBrandsInput}
                        />
                        <Button
                            title="Post"
                            onPress={uploadPost}
                            disabled={loading}
                        />
                    </>
                ) : (
                    <Text style={styles.placeholder}>Select an image to post</Text>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    image: {
        width: '100%',
        height: 300,
        marginBottom: 15
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        marginBottom: 20,
        borderRadius: 5,
    },
    placeholder: {
        textAlign: 'center',
        marginTop: 20,
        color: '#999',
    },
    trendingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10
    },
}); 