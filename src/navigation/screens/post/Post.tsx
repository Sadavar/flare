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

import { ColorCard } from '@/components/ColorCard';
import { Color } from '@/types';
import { useColors } from '@/hooks/usePostQueries';
import { MaterialIcons } from '@expo/vector-icons';
import { PostButton } from '@/components/PostButton';
import { theme } from '@/context/ThemeContext';
import { CustomText } from '@/components/CustomText';


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
    const [selectedStyleIds, setSelectedStyleIds] = useState<number[]>([]);

    const [colorOptions, setColorOptions] = useState<Color[]>([]);
    const [selectedColorIds, setSelectedColorIds] = useState<number[]>([]);
    const colorModalizeRef = useRef<Modalize>(null);

    const [brandsInput, setBrandsInput] = useState('');
    const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
    const [taggedBrands, setTaggedBrands] = useState<BrandTag[]>([]);
    const [activePosition, setActivePosition] = useState<{ x: number, y: number } | null>(null);
    const [isDragging, setIsDragging] = useState<number | null>(null);

    const [loading, setLoading] = useState(false);
    const modalizeRef = useRef<Modalize>(null);
    const imageRef = useRef<View>(null);
    const navigation = useNavigation();
    const { user } = useSession();

    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: colors, isLoading: isColorLoading } = useColors();

    const scrollViewRef = useRef<ScrollView>(null);
    const descriptionRef = useRef<View>(null);

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
            setSelectedColorIds([]);
            colorModalizeRef.current?.close();
            modalizeRef.current?.close();
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

    const handleColorSelect = (colorId: number) => {
        setSelectedColorIds(prev => {
            if (prev.includes(colorId)) {
                return prev.filter(id => id !== colorId);
            }
            if (prev.length < 3) {
                return [...prev, colorId];
            }
            return prev;
        });
    };

    // Add handler for description focus
    const handleDescriptionFocus = () => {
        if (descriptionRef.current && scrollViewRef.current) {
            descriptionRef.current.measure((x, y, width, height, pageX, pageY) => {
                scrollViewRef.current?.scrollTo({
                    y: pageY,
                    animated: true
                });
            });
        }
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

            // Upload colors
            if (selectedColorIds.length > 0) {
                const colorRelations = selectedColorIds.map(colorId => ({
                    post_uuid: postData.uuid,
                    color_id: colorId,
                }));

                for (const color of colorRelations) {
                    const { error: colorError } = await supabase
                        .from('post_colors')
                        .insert(color);

                    if (colorError) throw colorError;
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
            <ScrollView
                ref={scrollViewRef}
                keyboardShouldPersistTaps='handled'
            >
                <View style={styles.container}>

                    {/* Image Preview */}

                    {image ? (
                        <>
                            <CustomText style={styles.trendingTitle}>Image Preview</CustomText>
                            <CustomText style={styles.tagInstruction}>Tap image to add brands</CustomText>
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
                                            <CustomText
                                                style={styles.tagText}
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                            >
                                                {tag.name}
                                            </CustomText>
                                            <TouchableOpacity
                                                onPress={() => removeTag(index)}
                                                style={styles.removeButton}
                                            >
                                                <CustomText style={styles.removeButtonText}>×</CustomText>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            {/* Description */}
                            <View ref={descriptionRef}>
                                <CustomText style={styles.trendingTitle}>Description</CustomText>
                                <TextInput
                                    style={styles.input}
                                    placeholderTextColor={theme.colors.light_background_2}
                                    placeholder="Add a description..."
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    onFocus={handleDescriptionFocus}
                                />
                            </View>

                            {/* Colors */}

                            {colors && (
                                <View style={styles.colorSection}>
                                    <View style={styles.colorHeader}>
                                        <CustomText style={styles.colorTitle}>Colors</CustomText>
                                        <View style={styles.selectedColorPills}>
                                            {selectedColorIds.map(colorId => {
                                                const color = colors.find((c: Color) => c.id === colorId);
                                                if (!color) return null;
                                                return (
                                                    <TouchableOpacity
                                                        key={colorId}
                                                        onPress={() => handleColorSelect(colorId)}
                                                        style={styles.colorPillContainer}
                                                    >
                                                        <View style={styles.pillWrapper}>
                                                            <View
                                                                style={[
                                                                    styles.colorSquare,
                                                                    { backgroundColor: color.hex_value }
                                                                ]}
                                                            />
                                                            <View style={styles.closeButtonContainer}>
                                                                <MaterialIcons name="close" size={12} color="#666" />
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>

                                    <View style={styles.quickSelectHeader}>
                                        <CustomText style={styles.subtitle}>Quick Select</CustomText>
                                        <TouchableOpacity
                                            onPress={() => colorModalizeRef.current?.open()}
                                            style={styles.seeAllButton}
                                        >
                                            <CustomText style={styles.seeAllText}>See All Colors</CustomText>
                                            <MaterialIcons name="chevron-right" size={20} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.quickSelectScroll}
                                    >
                                        {colors?.slice(0, 15).map((color: Color) => (
                                            <ColorCard
                                                key={color.id}
                                                color={color}
                                                size="small"
                                                isSelected={selectedColorIds.includes(color.id)}
                                                onPress={() => handleColorSelect(color.id)}
                                            />
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Styles */}

                            <View>
                                <CustomText style={styles.trendingTitle}>Style</CustomText>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.styleScrollContainer}
                                >
                                    <View style={styles.styleRows}>
                                        <View style={styles.styleRow}>
                                            {styleOptions.slice(0, Math.ceil(styleOptions.length / 2)).map((style) => (
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
                                                    <CustomText style={[
                                                        styles.styleChipText,
                                                        selectedStyleIds.includes(style.id) && styles.selectedStyleChipText
                                                    ]}>
                                                        {style.name}
                                                    </CustomText>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                        <View style={styles.styleRow}>
                                            {styleOptions.slice(Math.ceil(styleOptions.length / 2)).map((style) => (
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
                                                    <CustomText style={[
                                                        styles.styleChipText,
                                                        selectedStyleIds.includes(style.id) && styles.selectedStyleChipText
                                                    ]}>
                                                        {style.name}
                                                    </CustomText>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </ScrollView>
                            </View>

                            {/* Brands */}

                            <CustomText style={styles.trendingTitle}>Brands</CustomText>
                            <View style={styles.taggedBrandsContainer}>
                                {taggedBrands.map((brand, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.taggedBrand}
                                        onPress={() => {
                                            setTaggedBrands(taggedBrands.filter((_, i) => i !== index));
                                        }}
                                    >
                                        <CustomText style={styles.taggedBrandText}>{brand.name}</CustomText>
                                        <CustomText style={styles.removeTag}>X</CustomText>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Post Button */}
                            <PostButton
                                onPress={uploadPost}
                                loading={loading}
                            />
                        </>
                    ) : (
                        <CustomText style={styles.placeholder}>Select an image to post</CustomText>
                    )}
                </View>

                {/* Color Modal */}
                <Modalize
                    ref={colorModalizeRef}
                    modalHeight={500}
                    modalStyle={styles.modalContainer}
                    panGestureEnabled={false}
                    onOpen={() => setIsModalOpen(true)}
                    onClose={() => setIsModalOpen(false)}
                >
                    <View style={styles.modalContent}>
                        <CustomText style={styles.modalTitle}>All Colors</CustomText>
                        <CustomText style={styles.modalSubtitle}>
                            Select up to 3 colors ({selectedColorIds.length}/3)
                        </CustomText>
                        <ScrollView style={styles.colorGrid}>
                            <View style={styles.gridContainer}>
                                {colors?.map((color: Color) => (
                                    <ColorCard
                                        key={color.id}
                                        color={color}
                                        isSelected={selectedColorIds.includes(color.id)}
                                        onPress={() => handleColorSelect(color.id)}
                                    />
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </Modalize>

                {/* Brand Modal */}

                <Modalize
                    ref={modalizeRef}
                    modalStyle={styles.modalContainer}
                    modalHeight={700}
                    onOpen={() => setIsModalOpen(true)}
                    onClose={() => setIsModalOpen(false)}
                    panGestureEnabled={false}
                >
                    <View style={styles.modalContent}>
                        <CustomText style={styles.modalTitle}>Tag a Brand</CustomText>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search brands..."
                            placeholderTextColor={theme.colors.light_background_2}
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
                                    <CustomText style={styles.suggestionText}>{brand}</CustomText>
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
        // backgroundColor: theme.colors.background
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    image: {
        height: 300,
        marginBottom: 15,
    },
    tagInstruction: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 10,
        fontSize: 14,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.light_background_1,
        padding: 10,
        marginBottom: 20,
        borderRadius: 8,

    },
    placeholder: {
        textAlign: 'center',
        marginTop: 20,
        color: theme.colors.light_background_2,
    },
    trendingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
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
    },
    styleRows: {
        flexDirection: 'column',
        gap: 8,
    },
    styleRow: {
        flexDirection: 'row',
        gap: 8,
    },
    styleChip: {
        backgroundColor: theme.colors.light_background_1,
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    selectedStyleChip: {
        backgroundColor: theme.colors.light_background_2,
    },
    styleChipText: {
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
        color: theme.colors.light_background_3,
        borderColor: theme.colors.light_background_1,
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
        color: theme.colors.light_background_3
    },
    colorSection: {
        marginBottom: 20,
    },
    colorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50
    },
    colorTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    selectedColorPills: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 10,
        marginLeft: 10,
    },
    colorPillContainer: {
        marginHorizontal: 4,
    },
    pillWrapper: {
        position: 'relative',
    },
    closeButtonContainer: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: 'white',
        borderRadius: 10,
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    colorSquare: {
        width: 20,
        height: 20,
        borderRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 1,
        elevation: 5,
    },
    quickSelectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    seeAllText: {
        fontSize: 14,
        color: '#666',
        marginRight: 4,
    },
    quickSelectScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    modalContainer: {
        padding: 20,
        backgroundColor: theme.colors.background
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    colorGrid: {
        flex: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
});
