import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Modalize } from 'react-native-modalize';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '@/types';
import { CustomText } from '@/components/CustomText'
import { theme } from '@/context/ThemeContext';

interface PostModalProps {
    modalRef: React.RefObject<Modalize>;
}

type PostNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Post'>,
    NativeStackNavigationProp<RootStackParamList>
>;

export function PostModal({ modalRef }: PostModalProps) {
    const navigation = useNavigation<PostNavigationProp>();
    const [isLoading, setIsLoading] = useState(false);

    const handleImagePick = async (useCamera: boolean) => {
        try {
            setIsLoading(true);
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
                console.log('launching image library');
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
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.content}>
            <CustomText style={styles.title}>Create Post</CustomText>

            <TouchableOpacity
                style={[styles.option, isLoading && styles.optionDisabled]}
                onPress={() => !isLoading && handleImagePick(false)}
                disabled={isLoading}
            >
                <MaterialIcons name="photo-library" size={24} color={isLoading ? theme.colors.light_background_2 : "white"} />
                <CustomText style={[styles.optionText, isLoading && styles.optionTextDisabled]}>
                    Choose from Library
                </CustomText>
                {isLoading && <ActivityIndicator style={styles.loader} color="#666" />}
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.option, isLoading && styles.optionDisabled]}
                onPress={() => !isLoading && handleImagePick(true)}
                disabled={isLoading}
            >
                <MaterialIcons name="camera-alt" size={24} color={isLoading ? theme.colors.light_background_2 : "white"} />
                <CustomText style={[styles.optionText, isLoading && styles.optionTextDisabled]}>
                    Take Photo
                </CustomText>
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
        borderBottomColor: theme.colors.light_background_1,
    },
    optionDisabled: {
        opacity: 0.6,
    },
    optionText: {
        fontSize: 16,
        marginLeft: 10,
        flex: 1,
    },
    optionTextDisabled: {
        color: '#999',
    },
    loader: {
        marginLeft: 10,
    },
}); 