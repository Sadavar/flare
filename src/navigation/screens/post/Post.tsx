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
    LayoutChangeEvent,
    Modal,
    Dimensions,
    ActivityIndicator,
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
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { ColorCard } from '@/components/ColorCard';
import { Color } from '@/types';
import { useColors } from '@/hooks/usePostQueries';
import { MaterialIcons } from '@expo/vector-icons';
import { PostButton } from '@/components/PostButton';
import { theme } from '@/context/ThemeContext';
import { CustomText } from '@/components/CustomText';
import { transform } from '@babel/core';
import { PostModal } from '@/components/PostModal';


type PostScreenRouteProp = RouteProp<MainTabParamList, 'Post'>;

type BrandTag = {
    name: string;
    x: number;
    y: number;
    isPending?: boolean;
    website_url?: string;
    instagram_url?: string;
};

type Style = {
    id: number;
    name: string;
};

type PhotoMenuOption = 'library' | 'camera';

export function Post() {
    const route = useRoute<PostScreenRouteProp>();
    const [image, setImage] = useState<string | null>(null);
    const navigation = useNavigation();

    const [description, setDescription] = useState('');
    const [selectedStyleIds, setSelectedStyleIds] = useState<number[]>([]);

    const [colorOptions, setColorOptions] = useState<Color[]>([]);
    const [selectedColorIds, setSelectedColorIds] = useState<number[]>([]);
    const colorModalizeRef = useRef<Modalize>(null);

    const [brandsInput, setBrandsInput] = useState('');
    const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
    const [taggedBrands, setTaggedBrands] = useState<BrandTag[]>([]);
    const [activePosition, setActivePosition] = useState<{ x: number, y: number } | null>(null);

    const [actualImageDimensions, setActualImageDimensions] = useState({
        width: 0,
        height: 0,
        x: 0,
        y: 0
    });

    // New state for pending brand creation
    const [showAddBrandModal, setShowAddBrandModal] = useState(false);
    const [newBrandName, setNewBrandName] = useState('');
    const [newBrandWebsite, setNewBrandWebsite] = useState('');
    const [newBrandInstagram, setNewBrandInstagram] = useState('');

    const [loading, setLoading] = useState(false);
    const modalizeRef = useRef<Modalize>(null);
    const postModalRef = useRef<Modalize>(null);
    const imageRef = useRef<View>(null);
    const { user } = useSession();

    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: colors, isLoading: isColorLoading } = useColors();

    const scrollViewRef = useRef<ScrollView>(null);
    const descriptionRef = useRef<View>(null);

    // Brand modal refs, scroll down on input logic
    const brandFormScrollRef = useRef(null);
    const brandNameInputRef = useRef(null);
    const brandWebsiteInputRef = useRef(null);
    const brandInstagramInputRef = useRef(null);

    // Add new state for image picker loading
    const [isImagePickerLoading, setIsImagePickerLoading] = useState(false);

    const [showPhotoMenu, setShowPhotoMenu] = useState(false);
    const [isPhotoPickerLoading, setIsPhotoPickerLoading] = useState(false);

    const handleFormInputFocus = (inputRef: React.RefObject<View>) => {
        if (inputRef.current && brandFormScrollRef.current) {
            // Add a slight delay to ensure the keyboard is visible when measuring
            setTimeout(() => {
                inputRef.current?.measureLayout(
                    brandFormScrollRef.current as unknown as number,
                    (_, y) => {
                        // Scroll to the input with some padding
                        (brandFormScrollRef.current as unknown as ScrollView)?.scrollTo({
                            y: 200,
                            animated: true
                        });
                    },
                    () => console.log('Measurement failed')
                );
            }, 100);
        }
    };

    const [imageLayout, setImageLayout] = useState<{
        width: number;
        height: number;
        pageX: number;
        pageY: number;
    } | null>(null);

    const [styleOptions, setStyleOptions] = useState<Style[]>([]);

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

        if (!imageLayout) return;

        // Get coordinates relative to the touchable overlay
        const touchX = event.nativeEvent.locationX;
        const touchY = event.nativeEvent.locationY;

        // Calculate position as percentage of image dimensions
        const xPercent = (touchX / imageLayout.width) * 100;
        const yPercent = (touchY / imageLayout.height) * 100;

        console.log(xPercent, yPercent);

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

    // Handler for adding a pending brand
    const handleAddPendingBrand = () => {
        if (activePosition && newBrandName.trim()) {
            setTaggedBrands([...taggedBrands, {
                name: newBrandName,
                x: activePosition.x,
                y: activePosition.y,
                isPending: true,
                website_url: newBrandWebsite,
                instagram_url: newBrandInstagram
            }]);

            // Reset the form
            setNewBrandName('');
            setNewBrandWebsite('');
            setNewBrandInstagram('');
            setShowAddBrandModal(false);
            modalizeRef.current?.close();
            setActivePosition(null);
            setBrandsInput('');
        }
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

            // get dimensions
            let changedWidth = manipulatedImage.width;
            let changedHeight = manipulatedImage.height;

            console.log(changedWidth, changedHeight);

            const file_id = uuid.v4().toString();
            const fileName = `outfits/${user.id}/${file_id}.jpg`;

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

            // Process tagged brands
            for (const tag of taggedBrands) {
                if (tag.isPending) {
                    // Insert into pending_brands table
                    const { data: pendingBrandData, error: pendingBrandError } = await supabase
                        .from('pending_brands')
                        .insert([{
                            brand_name: tag.name,
                            website_url: tag.website_url || '',
                            instagram_url: tag.instagram_url || '',
                            user_id: user.id
                        }])
                        .select('id')
                        .single();

                    if (pendingBrandError) throw pendingBrandError;

                    // Create association in post_pending_brands table
                    await supabase
                        .from('post_pending_brands')
                        .insert([{
                            post_uuid: postData.uuid,
                            brand_id: pendingBrandData.id,
                            x_coord: tag.x,
                            y_coord: tag.y
                        }]);
                } else {
                    // Process existing brands as before
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
            }

            navigation.navigate('Profile' as never);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        calcImageLayout();
    }, [image]);

    async function calcImageLayout() {
        // get dimension screenw dith
        let screenWidth = Dimensions.get('window').width;

        // get original image width and height with image manipulator
        const manipulatedImage = await ImageManipulator.manipulateAsync(image)

        console.log(manipulatedImage.width, manipulatedImage.height);
        let originalImageWidth = manipulatedImage.width;
        let originalImageHeight = manipulatedImage.height;

        let aspectRatio = originalImageWidth / originalImageHeight;

        let newImageHeight = 300;

        let newImageWidth = newImageHeight * aspectRatio;

        console.log(newImageWidth, newImageHeight);

        setImageLayout({ width: newImageWidth, height: newImageHeight });
    }

    // Add image picker handler
    const handlePhotoOption = async (option: PhotoMenuOption) => {
        try {
            setIsPhotoPickerLoading(true);
            let result;

            if (option === 'camera') {
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
                setImage(result.assets[0].uri);
                setShowPhotoMenu(false);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            alert('Error picking image');
        } finally {
            setIsPhotoPickerLoading(false);
        }
    };

    // Add this handler to close the menu when clicking outside
    const handleBackdropPress = () => {
        setShowPhotoMenu(false);
    };

    // Add this useEffect near your other useEffect hooks:
    useEffect(() => {
        // Reset scroll position when screen is focused
        const unsubscribe = navigation.addListener('focus', () => {
            scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, [navigation]);

    return (
        <>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <ScrollView
                    ref={scrollViewRef}
                    keyboardShouldPersistTaps='handled'
                    scrollEnabled={!isModalOpen}
                >
                    <View style={styles.container}>

                        {/* Image Preview */}

                        {image ? (
                            <>
                                <View style={styles.imageHeaderContainer}>
                                    <CustomText style={styles.trendingTitle}>Image Preview</CustomText>
                                    <View style={styles.photoMenuContainer}>
                                        <TouchableOpacity
                                            style={styles.changePhotoButton}
                                            onPress={() => setShowPhotoMenu(!showPhotoMenu)}
                                        >
                                            <CustomText style={styles.changePhotoText}>Change Photo</CustomText>
                                        </TouchableOpacity>

                                        {showPhotoMenu && (
                                            <>
                                                <TouchableWithoutFeedback onPress={handleBackdropPress}>
                                                    <View style={styles.backdrop} />
                                                </TouchableWithoutFeedback>
                                                <View style={styles.photoMenu}>
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.photoMenuItem,
                                                            isPhotoPickerLoading && styles.photoMenuItemDisabled
                                                        ]}
                                                        onPress={() => handlePhotoOption('library')}
                                                        disabled={isPhotoPickerLoading}
                                                    >
                                                        <MaterialIcons
                                                            name="photo-library"
                                                            size={24}
                                                            color={isPhotoPickerLoading ? theme.colors.light_background_2 : "white"}
                                                        />
                                                        <CustomText style={styles.photoMenuItemText}>
                                                            Choose from Library
                                                        </CustomText>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={[
                                                            styles.photoMenuItem,
                                                            isPhotoPickerLoading && styles.photoMenuItemDisabled
                                                        ]}
                                                        onPress={() => handlePhotoOption('camera')}
                                                        disabled={isPhotoPickerLoading}
                                                    >
                                                        <MaterialIcons
                                                            name="camera-alt"
                                                            size={24}
                                                            color={isPhotoPickerLoading ? theme.colors.light_background_2 : "white"}
                                                        />
                                                        <CustomText style={styles.photoMenuItemText}>
                                                            Take Photo
                                                        </CustomText>
                                                    </TouchableOpacity>
                                                </View>
                                            </>
                                        )}
                                    </View>
                                </View>
                                <CustomText style={styles.tagInstruction}>Tap image to add brands</CustomText>



                                <View
                                    ref={imageRef}
                                    style={styles.imageContainer}
                                    onLayout={() => {
                                        calcImageLayout();
                                    }}
                                >
                                    <Image
                                        source={{ uri: image }}
                                        style={styles.image}
                                        contentFit='contain'
                                        onLayout={async () => {
                                            calcImageLayout();
                                        }}
                                    />

                                    {/* Single overlay for both tap detection and tag display */}
                                    <View
                                        style={{
                                            width: '100%',
                                            height: 300,
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            zIndex: 10
                                        }}
                                    >
                                        <TouchableWithoutFeedback onPress={handleImagePress}>
                                            <View
                                                style={{
                                                    width: imageLayout?.width,
                                                    height: imageLayout?.height,
                                                    position: 'relative',
                                                    backgroundColor: 'transparent' // Changed from red background to transparent
                                                }}
                                            >
                                                {/* Render tags directly within the touchable area */}
                                                {taggedBrands.map((tag, index) => (
                                                    <View
                                                        key={index}
                                                        style={[
                                                            styles.tagPill,
                                                            {
                                                                left: `${tag.x}%`,
                                                                top: `${tag.y}%`,
                                                            },
                                                            {
                                                                transform: [{ translateX: -50 }, { translateY: -10 }]
                                                            }
                                                        ]}
                                                        pointerEvents="box-none"
                                                    >
                                                        <View
                                                            style={[
                                                                styles.tagPillContent,
                                                                tag.isPending && styles.pendingTagPill
                                                            ]}
                                                        >
                                                            <CustomText
                                                                style={styles.tagText}
                                                                numberOfLines={1}
                                                                ellipsizeMode="tail"
                                                            >
                                                                {tag.name}
                                                            </CustomText>

                                                            {/* Make remove button a separate touchable */}
                                                            <TouchableOpacity
                                                                onPress={(e) => {
                                                                    e.stopPropagation(); // Stop propagation to parent
                                                                    removeTag(index);
                                                                }}
                                                                style={styles.removeButton}
                                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Increase touch target
                                                            >
                                                                <CustomText style={styles.removeButtonText}>×</CustomText>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        </TouchableWithoutFeedback>
                                    </View>
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
                                            style={[
                                                styles.taggedBrand,
                                                brand.isPending && styles.pendingTaggedBrand
                                            ]}
                                            onPress={() => {
                                                setTaggedBrands(taggedBrands.filter((_, i) => i !== index));
                                            }}
                                        >
                                            <CustomText style={styles.taggedBrandText}>
                                                {brand.name} {brand.isPending && '(Pending)'}
                                            </CustomText>
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



                </ScrollView>
            </TouchableWithoutFeedback>

            {/* Color Modal */}
            <Modalize
                ref={colorModalizeRef}
                modalHeight={Dimensions.get('window').height * 0.6}
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
                modalHeight={Dimensions.get('window').height * 0.6}
                onOpen={() => setIsModalOpen(true)}
                onClose={() => {
                    setIsModalOpen(false);
                    setShowAddBrandModal(false);
                    setNewBrandName('');
                    setNewBrandWebsite('');
                    setNewBrandInstagram('');
                }}
                panGestureEnabled={false}
            >
                <View style={styles.modalContent}>
                    {!showAddBrandModal ? (
                        <CustomText style={styles.modalTitle}>Tag a Brand</CustomText>
                    ) : (
                        <CustomText style={styles.modalTitle}>Add a Brand</CustomText>
                    )}
                    {!showAddBrandModal ? (
                        <>
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
                                {brandSuggestions.length > 0 ? (
                                    brandSuggestions.map((brand, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={styles.suggestionItem}
                                            onPress={() => handleBrandSelect(brand)}
                                        >
                                            <CustomText style={styles.suggestionText}>{brand}</CustomText>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.noResultsContainer}>
                                        <CustomText style={styles.noResultsText}>
                                            No brands found matching your search.
                                        </CustomText>
                                        <TouchableOpacity
                                            style={styles.addBrandButton}
                                            onPress={() => {
                                                setShowAddBrandModal(true);
                                                setNewBrandName(brandsInput);
                                            }}
                                        >
                                            <CustomText style={styles.addBrandButtonText}>
                                                Add Brand
                                            </CustomText>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </ScrollView>
                        </>
                    ) : (
                        <ScrollView
                            ref={brandFormScrollRef}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ paddingBottom: 100 }}
                        >
                            <View style={styles.addBrandForm}>
                                <CustomText style={styles.formLabel}>Brand Name*</CustomText>
                                <TextInput
                                    ref={brandNameInputRef}
                                    style={styles.formInput}
                                    value={newBrandName}
                                    onChangeText={setNewBrandName}
                                    placeholder="Enter brand name"
                                    placeholderTextColor={theme.colors.light_background_2}
                                    onFocus={() => handleFormInputFocus(brandNameInputRef)}
                                />

                                <CustomText style={styles.formLabel}>Website (optional)</CustomText>
                                <TextInput
                                    ref={brandWebsiteInputRef}
                                    style={styles.formInput}
                                    value={newBrandWebsite}
                                    onChangeText={setNewBrandWebsite}
                                    placeholder="https://..."
                                    placeholderTextColor={theme.colors.light_background_2}
                                    onFocus={() => handleFormInputFocus(brandWebsiteInputRef)}
                                />

                                <CustomText style={styles.formLabel}>Instagram (optional)</CustomText>
                                <TextInput
                                    ref={brandInstagramInputRef}
                                    style={styles.formInput}
                                    value={newBrandInstagram}
                                    onChangeText={setNewBrandInstagram}
                                    placeholder="@username"
                                    placeholderTextColor={theme.colors.light_background_2}
                                    onFocus={() => handleFormInputFocus(brandInstagramInputRef)}
                                />

                                <View style={styles.formButtons}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setShowAddBrandModal(false)}
                                    >
                                        <CustomText style={styles.cancelButtonText}>Cancel</CustomText>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.submitButton,
                                            !newBrandName.trim() && styles.disabledButton
                                        ]}
                                        onPress={handleAddPendingBrand}
                                        disabled={!newBrandName.trim()}
                                    >
                                        <CustomText style={styles.submitButtonText}>Add Brand</CustomText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    )}
                </View>
            </Modalize>

        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        // backgroundColor: theme.colors.background
    },
    imageHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    changePhotoButton: {
        backgroundColor: theme.colors.light_background_1,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    changePhotoText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    image: {
        height: 300,
        marginBottom: 15,
    },
    touchableOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: 'transparent',
        zIndex: 1,
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
        color: theme.colors.text,
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
        backgroundColor: theme.colors.light_background_1,
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginRight: 5,
        marginBottom: 5,
    },
    pendingTaggedBrand: {
        backgroundColor: theme.colors.light_background_2,
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
        zIndex: 20,
        maxWidth: 100,
        pointerEvents: 'auto',
    },
    tagPillContent: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.light_background_2,
        borderRadius: 15,
        paddingVertical: 4,
        paddingHorizontal: 10,
    },
    pendingTagPill: {
        backgroundColor: 'rgba(255, 215, 0, 0.8)', // Yellow with opacity for pending tags
    },
    tagText: {
        color: theme.colors.text,
        fontSize: 12,
        marginRight: 5,
        flexShrink: 1,
    },
    removeButton: {
        width: 16,
        height: 16,
        alignItems: 'center',
        zIndex: 30,
        justifyContent: 'center',
        pointerEvents: 'auto',
    },
    removeButtonText: {
        color: theme.colors.text,
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
        width: 300,
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
    // New styles for no results and add brand
    noResultsContainer: {
        alignItems: 'center',
        marginTop: 20,
        width: 300,
    },
    noResultsText: {
        textAlign: 'center',
        marginBottom: 15,
        color: '#666',
    },
    addBrandButton: {
        backgroundColor: theme.colors.light_background_2,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 10,
    },
    addBrandButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // New Brand Form styles
    addBrandForm: {
        width: 300,
        marginTop: 10,
    },
    formLabel: {
        fontSize: 14,
        marginBottom: 5,
        color: theme.colors.light_background_3,
    },
    formInput: {
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.light_background_1,
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
    },
    formButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginRight: 10,
    },
    cancelButtonText: {
        color: '#333',
    },
    submitButton: {
        backgroundColor: theme.colors.light_background_2,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.5,
    },
    imagePickerContent: {
        padding: 20,
    },
    imagePickerOption: {
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
    photoMenuContainer: {
        position: 'relative',
        zIndex: 1000, // Higher z-index to ensure menu appears above other content
    },
    backdrop: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        position: 'absolute',
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    photoMenu: {
        position: 'absolute',
        top: '100%',
        right: 0,
        backgroundColor: theme.colors.background,
        borderRadius: 8,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        minWidth: 200,
        zIndex: 1000,
    },
    photoMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.light_background_1,
        marginBottom: 8,
    },
    photoMenuItemDisabled: {
        opacity: 0.6,
    },
    photoMenuItemText: {
        marginLeft: 12,
        color: '#fff',
        fontSize: 14,
    },
});
