import React, { useState, useEffect, useRef } from 'react';
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
    PanResponder,
    GestureResponderEvent,
    LayoutChangeEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/context/SessionContext';
import { decode } from 'base64-arraybuffer';
import uuid from 'react-native-uuid';
import { Modalize } from 'react-native-modalize';
import type { RouteProp } from '@react-navigation/native';
import type { MainTabParamList } from '@/types';
import { Dimensions } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

type PostScreenRouteProp = RouteProp<MainTabParamList, 'Post'>;

type BrandTag = {
    name: string;
    x: number;
    y: number;
};

type Style = {
    id: number;
    name: string;
};

export function Post() {
    const route = useRoute<PostScreenRouteProp>();
    const [image, setImage] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [brandsInput, setBrandsInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
    const [taggedBrands, setTaggedBrands] = useState<BrandTag[]>([]);
    const [activePosition, setActivePosition] = useState<{ x: number, y: number } | null>(null);
    const [selectedStyleIds, setSelectedStyleIds] = useState<number[]>([]);
    const [isDragging, setIsDragging] = useState<number | null>(null);
    const modalizeRef = useRef<Modalize>(null);
    const imageRef = useRef<View>(null);
    const navigation = useNavigation();
    const { user } = useSession();

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [imageLayout, setImageLayout] = useState<{
        width: number;
        height: number;
        pageX: number;
        pageY: number;
    } | null>(null);

    const [tagPillSizes, setTagPillSizes] = useState<{ width: number; height: number }[]>([]);

    const [styleOptions, setStyleOptions] = useState<Style[]>([]);

    const handleTagLayout = (index: number, event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setTagPillSizes(prevSizes => {
            const newSizes = [...prevSizes];
            newSizes[index] = { width, height };
            return newSizes;
        });
    };

    // Add this useEffect to get and store image layout
    useEffect(() => {
        if (imageRef.current) {
            imageRef.current.measure((x, y, width, height, pageX, pageY) => {
                setImageLayout({ width, height, pageX, pageY });
            });
        }
    }, [image]); // Re-measure when image changes


    useEffect(() => {
        // Set image from navigation params if available
        if (route.params?.image) {
            setImage(route.params.image);
            setDescription('');
            setBrandsInput('');
            setTaggedBrands([]);
            setSelectedStyleIds([]);
        }
    }, [route.params?.image]);

    useEffect(() => {
        const fetchBrands = async () => {
            if (brandsInput.length == 0) {
                const { data, error } = await supabase
                    .from('brands')
                    .select('name')
                if (!error && data) {
                    const brands = data.map(item => item.name);
                    setBrandSuggestions([...brands, ...brands, ...brands]);
                } else {
                }
            }
        }
        fetchBrands();
    }, [brandsInput])

    useEffect(() => {
        const fetchStyles = async () => {
            const { data, error } = await supabase
                .from('styles')
                .select('id, name');

            if (!error && data) {
                setStyleOptions(data);
            } else {
                console.error('Error fetching styles:', error);
            }
        };

        fetchStyles();
    }, []);

    const handleImagePress = (event: any) => {
        event.persist(); // Persist the event

        if (isDragging !== null || !imageLayout) return;

        const touchX = event.nativeEvent.pageX - imageLayout.pageX;
        const touchY = event.nativeEvent.pageY - imageLayout.pageY;

        // Calculate position as percentage of image dimensions
        const xPercent = (touchX / imageLayout.width) * 100;
        const yPercent = (touchY / imageLayout.height) * 100;

        // Ensure coordinates are within bounds
        if (xPercent >= 0 && xPercent <= 100 && yPercent >= 0 && yPercent <= 100) {
            setActivePosition({ x: xPercent, y: yPercent });
            modalizeRef.current?.open();
        }
    };

    const handleBrandSelect = (brandName: string) => {
        if (activePosition) {
            setTaggedBrands([...taggedBrands, {
                name: brandName,
                x: activePosition.x,
                y: activePosition.y
            }]);
            modalizeRef.current?.close();
            setActivePosition(null);
            setBrandsInput('');
        }
    };

    const handleTagDragStart = (index: number) => {
        setIsDragging(index);
    };

    const handleTagDragMove = (event: GestureResponderEvent, index: number) => {
        event.persist();
        if (isDragging === index && imageLayout) {
            const { pageX, pageY } = imageLayout;

            const touchX = event.nativeEvent.pageX - pageX;
            const touchY = event.nativeEvent.pageY - pageY;

            const { width = 0, height = 0 } = tagPillSizes[index] || {};

            const adjustedWidth = imageLayout.width - width;
            const adjustedHeight = imageLayout.height - height;

            const screenWidth = Dimensions.get('window').width;
            console.log("screen width", screenWidth)

            console.log('touchX:', touchX);
            console.log('touchY:', touchY);
            console.log('imageLayout:', imageLayout);
            console.log('tagPillSizes:', tagPillSizes);

            if (touchX >= width && touchX <= adjustedWidth &&
                touchY >= 50 && touchY <= 360) {

                const xPercent = Math.max(0, Math.min((touchX / imageLayout.width) * 100, 100));
                const yPercent = Math.max(0, Math.min((touchY / imageLayout.height) * 100, 100));

                const updatedTags = [...taggedBrands];
                updatedTags[index] = {
                    ...updatedTags[index],
                    x: xPercent,
                    y: yPercent
                };
                setTaggedBrands(updatedTags);
            }
        }
    };


    const handleTagDragEnd = () => {
        setIsDragging(null);
    };

    const removeTag = (index: number) => {
        setTaggedBrands(taggedBrands.filter((_, i) => i !== index));
    };

    const uploadPost = async () => {
        if (!image || !user) return;
        setLoading(true);

        try {
            // First, compress and resize the image
            const manipulatedImage = await ImageManipulator.manipulateAsync(
                image,
                [
                    {
                        resize: {
                            width: 1080
                        }
                    }
                ],
                {
                    compress: 0.7,
                    format: ImageManipulator.SaveFormat.JPEG
                }
            );
            const file_id = uuid.v4().toString();
            const fileName = `outfits/${user.id}/${file_id}.jpg`;

            console.log("manipulatedImage", manipulatedImage)
            console.log("fileName", fileName)

            const base64 = await fetch(manipulatedImage.uri)
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

            const public_image_url = supabase.storage
                .from('outfits')
                .getPublicUrl(fileName)
                .data.publicUrl

            console.log("public_image_url", public_image_url)

            const { data: postData, error: postError } = await supabase
                .from('posts')
                .insert([{
                    image_url: fileName,
                    public_image_url: public_image_url,
                    description,
                    user_uuid: user.id,
                }])
                .select('uuid')
                .single();

            if (postError) throw postError;

            // Insert style relationships
            if (selectedStyleIds.length > 0) {
                const styleRelations = selectedStyleIds.map(styleId => ({
                    post_uuid: postData.uuid,
                    style_id: styleId,
                }));
                console.log("styleRelations", styleRelations)

                for (const style of styleRelations) {
                    const { error: styleError } = await supabase
                        .from('post_styles')
                        .insert(style);

                    if (styleError) throw styleError;
                }
            }

            // Upload tagged brands with coordinates
            for (const tag of taggedBrands) {
                const { data: brandData, error: brandError } = await supabase
                    .from('brands')
                    .upsert([{ name: tag.name }], { onConflict: 'name' })
                    .select('id')
                    .single();

                if (brandError) throw brandError;

                await supabase
                    .from('post_brands')
                    .insert([{
                        post_uuid: postData.uuid,
                        brand_id: brandData.id,
                        x_coord: tag.x,
                        y_coord: tag.y
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
                <KeyboardAvoidingView behavior='position' keyboardVerticalOffset={150} enabled={!isModalOpen} >
                    <View style={styles.container}>
                        {image ? (
                            <>
                                <Text style={styles.trendingTitle}>Image Preview</Text>
                                <Text style={styles.tagInstruction}>Tap image to add brands</Text>
                                <View
                                    ref={imageRef}
                                    style={styles.imageContainer}
                                    onLayout={() => {
                                        // Re-measure on layout changes
                                        imageRef.current?.measure((x, y, width, height, pageX, pageY) => {
                                            setImageLayout({ width, height, pageX, pageY });
                                        });
                                    }}
                                // onLayout={(e) => {
                                //     const { x, y, width, height } = e.nativeEvent.layout;
                                //     console.log('Image Container:', { x, y, width, height });
                                // }}
                                >
                                    <TouchableWithoutFeedback onPress={handleImagePress}>
                                        <Image
                                            source={{ uri: image }}
                                            style={styles.image}
                                            contentFit='contain'
                                        />
                                    </TouchableWithoutFeedback>
                                    {taggedBrands.map((tag, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.tagPill,
                                                {
                                                    left: `${tag.x}%`,
                                                    top: `${tag.y}%`,
                                                }
                                            ]}
                                            onLayout={(event) => handleTagLayout(index, event)}
                                        >
                                            <View
                                                style={styles.tagPillContent}
                                                {...PanResponder.create({
                                                    onStartShouldSetPanResponder: () => true,
                                                    onPanResponderGrant: () => handleTagDragStart(index),
                                                    onPanResponderMove: (e) => handleTagDragMove(e, index),
                                                    onPanResponderRelease: handleTagDragEnd,
                                                }).panHandlers}
                                            >
                                                <Text
                                                    style={styles.tagText}
                                                    numberOfLines={1}
                                                    ellipsizeMode="tail"
                                                >
                                                    {tag.name}
                                                </Text>
                                                <TouchableOpacity
                                                    onPress={() => removeTag(index)}
                                                    style={styles.removeButton}
                                                >
                                                    <Text style={styles.removeButtonText}>×</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>


                                <Text style={styles.trendingTitle}>Description</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Add a description..."
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                />
                                <Text style={styles.trendingTitle}>Style</Text>

                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.styleScrollContainer}
                                >
                                    {styleOptions.map((style) => (
                                        <TouchableOpacity
                                            key={style.id}
                                            style={[
                                                styles.styleChip,
                                                selectedStyleIds.includes(style.id) && styles.selectedStyleChip
                                            ]}
                                            onPress={() => {
                                                if (selectedStyleIds.includes(style.id)) {
                                                    setSelectedStyleIds(selectedStyleIds.filter(id => id !== style.id));
                                                } else if (selectedStyleIds.length < 3) {
                                                    setSelectedStyleIds([...selectedStyleIds, style.id]);
                                                }
                                            }}
                                        >
                                            <Text style={[
                                                styles.styleChipText,
                                                selectedStyleIds.includes(style.id) && styles.selectedStyleChipText
                                            ]}>
                                                {style.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <Text style={styles.trendingTitle}>Brands</Text>
                                <View style={styles.taggedBrandsContainer}>
                                    {taggedBrands.map((brand, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.taggedBrand}
                                            onPress={() => {
                                                setTaggedBrands(taggedBrands.filter((_, i) => i !== index));
                                            }}
                                        >
                                            <Text style={styles.taggedBrandText}>{brand.name}</Text>
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

                <Modalize
                    ref={modalizeRef}
                    modalHeight={500}
                    onOpen={() => setIsModalOpen(true)}
                    onClose={() => setIsModalOpen(false)}
                    panGestureEnabled={false} // Disables swipe down to dismiss

                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Tag a Brand</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search brands..."
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
                        <ScrollView style={styles.suggestionsList}>
                            {brandSuggestions.map((brand, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.suggestionItem}
                                    onPress={() => handleBrandSelect(brand)}
                                >
                                    <Text style={styles.suggestionText}>{brand}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </Modalize>

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
    imageContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    image: {
        height: 300,
        marginBottom: 15
    },
    tagInstruction: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 10,
        fontSize: 14,
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
    styleScrollContainer: {
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    styleChip: {
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginHorizontal: 5,
    },
    selectedStyleChip: {
        backgroundColor: '#000',
    },
    styleChipText: {
        color: '#666',
        fontSize: 14,
    },
    selectedStyleChipText: {
        color: '#fff',
    },

    tagPill: {
        position: 'absolute',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        zIndex: 1,
        maxWidth: 100,
        maxHeight: 35
    },
    tagPillContent: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 15,
        paddingVertical: 4,
        paddingHorizontal: 10,

    },
    tagText: {
        color: '#fff',
        fontSize: 12,
        marginRight: 5,
        flexShrink: 1,
    },
    removeButton: {
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalContent: {
        alignItems: 'center',
    },
    modalTitle: {
        paddingTop: 20,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        width: 300,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        width: 300,
    },
    suggestionsList: {
        marginTop: 10,
    },
    suggestionItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    suggestionText: {
        fontSize: 16,
    },
});
