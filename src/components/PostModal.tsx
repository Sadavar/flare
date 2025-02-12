import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Modalize } from 'react-native-modalize';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '@/types';

interface PostModalProps {
    modalRef: React.RefObject<Modalize>;
}

type PostNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Post'>,
    NativeStackNavigationProp<RootStackParamList>
>;

export function PostModal({ modalRef }: PostModalProps) {
    const navigation = useNavigation<PostNavigationProp>();

    const handleImagePick = async (useCamera: boolean) => {
        try {
            let result;
            if (useCamera) {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    alert('Sorry, we need camera permissions to make this work!');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 1,
                });
            } else {
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 1,
                });
            }

            if (!result.canceled && result.assets[0] && result.assets[0].uri) {
                modalRef.current?.close();
                navigation.navigate('Main', {
                    screen: 'Post',
                    params: { image: result.assets[0].uri }
                });
            }
        } catch (error) {
            console.error('Error picking image:', error);
            alert('Error picking image');
        }
    };

    return (
        <View style={styles.content}>
            <Text style={styles.title}>Create Post</Text>
            <TouchableOpacity
                style={styles.option}
                onPress={() => handleImagePick(false)}
            >
                <MaterialIcons name="photo-library" size={24} color="#000" />
                <Text style={styles.optionText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.option}
                onPress={() => handleImagePick(true)}
            >
                <MaterialIcons name="camera-alt" size={24} color="#000" />
                <Text style={styles.optionText}>Take Photo</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    optionText: {
        fontSize: 16,
        marginLeft: 10,
    },
}); 