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

    console.log(post.saved)

    const handleSave = () => {
        setIsSaved(!isSaved);
        toggleSave(
            { post: post, saved: isSaved },
            {
                onError: () => {
                    setIsSaved(isSaved);
                }
            }
        );
    };

    return (
        <View style={styles.postContainer}>
            <TouchableOpacity
                onPress={() => navigation.navigate('PostDetails', { post: post })}
            >
                <Image
                    source={{ uri: post.image_url }}
                    style={styles.postImage}
                    contentFit="cover"
                    transition={500}
                />
            </TouchableOpacity>
            <View style={styles.postDetails}>
                <View style={styles.actionsRow}>
                    {/* Colors on the left */}
                    <View style={styles.colorDotsContainer}>
                        {post.colors && post.colors.length > 0 && (
                            <View style={styles.colorDotsContainer}>
                                {
                                    post.colors.slice(0, 3).map((color) => (
                                        <View
                                            key={color.id}
                                            style={[
                                                styles.colorDot,
                                                { backgroundColor: color.hex_value }
                                            ]}
                                        />
                                    ))
                                }
                            </View>
                        )}
                    </View>

                    {/* Save icon on the right */}
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                    >
                        <MaterialIcons
                            name={isSaved ? "bookmark" : "bookmark-border"}
                            size={25}
                            color={theme.colors.light_background_2}
                        />
                    </TouchableOpacity>
                </View>

                {/* Brands below */}
                {post.brands && post.brands.length > 0 && (
                    <View style={styles.brandsContainer}>
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
                    </View>
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    fixedHeader: {
        paddingTop: 10,
        backgroundColor: '#fff',
        zIndex: 1,
    },
    mainTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: 'center',
    },
    listContent: {
        paddingHorizontal: 8,
        paddingTop: 8,
        paddingBottom: 20,
    },
    postContainer: {
        flex: 1,
        margin: 6,
        borderRadius: 12,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 2,
        backgroundColor: theme.colors.light_background_1
        // overflow: 'hidden',
    },
    postImage: {
        width: '100%',
        aspectRatio: 0.75, // 3:4 aspect ratio (width:height)
        backgroundColor: 'white',
        borderRadius: 12,
    },
    postDetails: {
        width: '100%',
        paddingHorizontal: 3
    },
    brandsContainer: {
        paddingBottom: 10,
    },
    brandsLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: '#888',
        marginBottom: 4,
    },
    brandsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    brandButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: theme.colors.light_background_2,
        borderRadius: 6,
    },
    brandText: {
        fontSize: 10,
        color: 'white',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#e53935',
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    footerLoader: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },
    colorDotsContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    colorDot: {
        width: 14,
        height: 14,
        borderRadius: 4,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 2,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    saveButton: {
        padding: 0,
    },
});