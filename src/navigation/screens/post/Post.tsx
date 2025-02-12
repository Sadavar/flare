import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Button,
    TextInput,
    ScrollView,
    Keyboard,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    TouchableOpacity,
    Touchable
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/context/SessionContext';
import { decode } from 'base64-arraybuffer';
import uuid from 'react-native-uuid';
import type { RouteProp } from '@react-navigation/native';
import type { MainTabParamList } from '@/types';
import { Layout } from '@/components/Layout';

type PostScreenRouteProp = RouteProp<MainTabParamList, 'Post'>;

export function Post() {
    const route = useRoute<PostScreenRouteProp>();
    const [image, setImage] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [brandsInput, setBrandsInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
    const [taggedBrands, setTaggedBrands] = useState<string[]>([]);
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

            // const brands = brandsInput
            //     .split(',')
            //     .map(brand => brand.trim())
            //     .filter(brand => brand.length > 0);

            for (const brandName of taggedBrands) {
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView style={{ backgroundColor: 'white' }} keyboardShouldPersistTaps='handled'>
                <KeyboardAvoidingView behavior='position' keyboardVerticalOffset={150}>
                    <View style={styles.container}>
                        {image ? (
                            <>
                                <Text style={styles.trendingTitle}>Image Preview</Text>
                                <Image
                                    source={{ uri: image }}
                                    style={styles.image}
                                    contentFit='contain'
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
                                    placeholder="Add brands..."
                                    value={brandsInput}
                                    onChangeText={async (text) => {
                                        setBrandsInput(text);
                                        if (text.length > 0) {
                                            const { data, error } = await supabase
                                                .from('brands')
                                                .select('name')
                                                .ilike('name', `%${text}%`)
                                                .limit(5);

                                            if (error) {
                                                console.error('Error fetching brands:', error);
                                            } else {
                                                setBrandSuggestions(data.map(item => item.name));
                                            }
                                        } else {
                                            setBrandSuggestions([]);
                                        }
                                    }}
                                />
                                {brandSuggestions.map((suggestion, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.suggestion}
                                        onPress={() => {
                                            setTaggedBrands([...taggedBrands, suggestion]);
                                            setBrandSuggestions([]);
                                            setBrandsInput('');
                                        }}
                                    >
                                        <Text>{suggestion}</Text>
                                    </TouchableOpacity>
                                ))}
                                <View style={styles.taggedBrandsContainer}>
                                    {taggedBrands.map((brand, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.taggedBrand}
                                            onPress={() => {
                                                setTaggedBrands(taggedBrands.filter((_, i) => i !== index));
                                            }}
                                        >
                                            <Text style={styles.taggedBrandText}>{brand}</Text>
                                            <Text style={styles.removeTag}>X</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
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
                </KeyboardAvoidingView>
            </ScrollView>
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
    suggestionsContainer: {
        position: 'absolute',
        zIndex: 100,
        marginTop: 5,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
    },
    suggestion: {
        padding: 10,
        borderBottomWidth: 1,
        borderColor: '#eee',
    },
    taggedBrandsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    taggedBrand: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginRight: 5,
        marginBottom: 5,
    },
    taggedBrandText: {
        marginRight: 5,
    },
    removeTag: {
        color: 'red',
        fontWeight: 'bold',
    },
});