import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Post } from '@/types';
import { Image } from 'expo-image';
import { useSavePost } from '@/hooks/usePostQueries';
import { useEffect, useState } from 'react';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RootStackParamList, DiscoverTabParamList } from '@/types';
import { theme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

type PostCardNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<DiscoverTabParamList>,
    NativeStackNavigationProp<RootStackParamList>
>;

export default function PostCard({ post }: { post: Post }) {
    const navigation = useNavigation<PostCardNavigationProp>();

    const { mutate: toggleSave } = useSavePost();
    const [isSaved, setIsSaved] = useState(post.saved || false);

    useEffect(() => {
        if (post && post.saved != undefined && post.saved != null)
            setIsSaved(post.saved)
    }, [post])

    const handleSave = () => {
        // Add haptic feedback when saving/unsaving
        if (isSaved) {
            // When unsaving, provide a lighter impact
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
            // When saving, provide a success notification feeling
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        }

        setIsSaved(!isSaved);
        toggleSave(
            { post: post, saved: isSaved },
            {
                onError: () => {
                    setIsSaved(isSaved);
                    // Add error haptic feedback on failure
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
            }
        );
    };

    return (
        <View style={styles.postContainer}>
            <TouchableOpacity
                onPress={() => {
                    navigation.navigate('PostDetails', { post: post, viewType: "StandardView" })
                }}
            >
                <Image
                    source={{ uri: post.image_url }}
                    style={styles.postImage}
                    contentFit="cover"
                    transition={500}
                />
            </TouchableOpacity>

            {/* Brands and Save button container */}
            <View style={styles.actionsContainer}>
                {/* Brands on the left */}
                <View style={styles.brandsContainer}>
                    {post.brands && post.brands.length > 0 ? (
                        <View style={styles.brandsList}>
                            {post.brands.slice(0, 2).map((brand) => (
                                <TouchableOpacity
                                    key={brand.id}
                                    style={styles.brandButton}
                                    onPress={() => navigation.navigate('Brands', {
                                        screen: 'BrandDetails',
                                        params: { brandId: brand.id, brandName: brand.name }
                                    })}
                                >
                                    <Text style={styles.brandText}>{brand.name}</Text>
                                </TouchableOpacity>
                            ))}
                            {post.brands.length > 2 && (
                                <View style={styles.brandButton}>
                                    <Text style={styles.brandText}>+{post.brands.length - 2}</Text>
                                </View>
                            )}
                        </View>
                    ) : null}
                </View>

                {/* Save icon on the right */}
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                >
                    <MaterialIcons
                        name={isSaved ? "bookmark" : "bookmark-border"}
                        size={23}
                        color={isSaved ? theme.colors.primary : theme.colors.primary}
                    />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    postContainer: {
        flex: 1,
        margin: 6,
        borderRadius: 12,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    postImage: {
        width: '100%',
        aspectRatio: 0.75, // 3:4 aspect ratio (width:height)
        backgroundColor: 'white',
        borderRadius: 8,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between', // This keeps the save button on the right
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    brandsContainer: {
        flex: 1, // This takes up available space on the left
    },
    brandsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    brandButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: theme.colors.light_background_0,
        borderRadius: 6,
    },
    brandText: {
        fontSize: 12,
        color: 'white',
    },
    saveButton: {
        padding: 4,
    },
});