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
import { Modalize } from 'react-native-modalize';
import type { RouteProp } from '@react-navigation/native';
import type { MainTabParamList, Style, Post } from '@/types';
import { Dimensions } from 'react-native';
import { usePost } from '@/hooks/usePostQueries';

type PostEditScreenRouteProp = RouteProp<MainTabParamList, 'Post'>;

type BrandTag = {
    name: string;
    x: number;
    y: number;
};

export function PostEdit() {
    const route = useRoute<PostEditScreenRouteProp>();
    const { postId } = route.params;
    const { data: post } = usePost(postId);

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

    useEffect(() => {
        if (post) {
            // Set description
            setDescription(post.description || '');

            // Set tagged brands if they exist
            if (post.brands && post.brands.length > 0) {
                const existingBrands = post.brands.map(brand => ({
                    name: brand.name,
                    x: brand.x_coord,
                    y: brand.y_coord
                }));
                setTaggedBrands(existingBrands);
            }

            // Set selected styles if they exist
            if (post.styles && post.styles.length > 0) {
                const existingStyleIds = post.styles.map(style => style.id);
                setSelectedStyleIds(existingStyleIds);
            }
        }
    }, [post?.uuid]); // Only run when post UUID changes, not on every post change

    // Reuse existing layout and measurement effects
    useEffect(() => {
        if (imageRef.current) {
            imageRef.current.measure((x, y, width, height, pageX, pageY) => {
                setImageLayout({ width, height, pageX, pageY });
            });
        }
    }, [post?.image_url]);

    // Fetch brand suggestions
    useEffect(() => {
        const fetchBrands = async () => {
            if (brandsInput.length === 0) {
                const { data, error } = await supabase
                    .from('brands')
                    .select('name')
                if (!error && data) {
                    setBrandSuggestions(data.map(item => item.name));
                }
            }
        }
        fetchBrands();
    }, [brandsInput]);

    // Fetch style options
    useEffect(() => {
        const fetchStyles = async () => {
            const { data, error } = await supabase
                .from('styles')
                .select('id, name');

            if (!error && data) {
                setStyleOptions(data);
            }
        };

        fetchStyles();
    }, []);

    // Reuse existing tag handling functions
    const handleTagLayout = (index: number, event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setTagPillSizes(prevSizes => {
            const newSizes = [...prevSizes];
            newSizes[index] = { width, height };
            return newSizes;
        });
    };

    const handleImagePress = (event: any) => {
        event.persist();
        if (isDragging !== null || !imageLayout) return;

        const touchX = event.nativeEvent.pageX - imageLayout.pageX;
        const touchY = event.nativeEvent.pageY - imageLayout.pageY;

        const xPercent = (touchX / imageLayout.width) * 100;
        const yPercent = (touchY / imageLayout.height) * 100;

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

    // Reuse existing drag handling
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

    const savePost = async () => {
        if (!post || !user) return;
        setLoading(true);

        try {
            // Update post description
            const { error: updateError } = await supabase
                .from('posts')
                .update({ description })
                .eq('uuid', postId);

            if (updateError) throw updateError;

            // Delete existing style relationships
            await supabase
                .from('post_styles')
                .delete()
                .eq('post_uuid', postId);

            // Create new style relationships
            if (selectedStyleIds.length > 0) {
                const styleRelations = selectedStyleIds.map(styleId => ({
                    post_uuid: postId,
                    style_id: styleId,
                }));

                for (const style of styleRelations) {
                    const { error: styleError } = await supabase
                        .from('post_styles')
                        .insert(style);

                    if (styleError) throw styleError;
                }
            }

            // Delete existing brand tags
            await supabase
                .from('post_brands')
                .delete()
                .eq('post_uuid', postId);

            // Create new brand tags
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
                        post_uuid: postId,
                        brand_id: brandData.id,
                        x_coord: tag.x,
                        y_coord: tag.y
                    }]);
            }

            navigation.goBack();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!post) return null;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView style={{ backgroundColor: 'white' }} keyboardShouldPersistTaps='handled'>
                <KeyboardAvoidingView behavior='position' keyboardVerticalOffset={100} enabled={!isModalOpen}>
                    <View style={styles.container}>
                        <Text style={styles.trendingTitle}>Image Preview</Text>
                        <Text style={styles.tagInstruction}>Tap image to add brands</Text>
                        <View
                            ref={imageRef}
                            style={styles.imageContainer}
                            onLayout={() => {
                                imageRef.current?.measure((x, y, width, height, pageX, pageY) => {
                                    setImageLayout({ width, height, pageX, pageY });
                                });
                            }}
                        >
                            <TouchableWithoutFeedback onPress={handleImagePress}>
                                <Image
                                    source={{ uri: post.image_url }}
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
                                        <Text style={styles.tagText} numberOfLines={1} ellipsizeMode="tail">
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
                                    onPress={() => removeTag(index)}
                                >
                                    <Text style={styles.taggedBrandText}>{brand.name}</Text>
                                    <Text style={styles.removeTag}>X</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Button
                            title="Save Changes"
                            onPress={savePost}
                            disabled={loading}
                        />
                    </View>
                </KeyboardAvoidingView>

                <Modalize
                    ref={modalizeRef}
                    modalHeight={500}
                    onOpen={() => setIsModalOpen(true)}
                    onClose={() => setIsModalOpen(false)}
                    panGestureEnabled={false}
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
    trendingTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10
    },
    taggedBrandsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
        marginBottom: 20,
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
        marginBottom: 20,
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
        width: 300,
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