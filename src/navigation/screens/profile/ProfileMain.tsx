import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, TextInput, Modal, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSession } from '@/context/SessionContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Color, Post, ProfileStackParamList } from '@/types';
import { useGetSavedPosts, useUserPostsAll } from '@/hooks/usePostQueries';
import { useQueryClient } from '@tanstack/react-query';
import RecentPosts from './RecentPosts';
import SavedPosts from './SavedPosts';
import { CustomText } from '@/components/CustomText';
import { theme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';

type ProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

export function ProfileMain() {
    const navigation = useNavigation<ProfileNavigationProp>();
    const { user, username = '' } = useSession();
    const queryClient = useQueryClient();
    const [bio, setBio] = useState('');
    const [editingBio, setEditingBio] = useState(false);
    const [newBio, setNewBio] = useState('');

    // Get all user posts
    const { data: allPosts = [], refetch, isLoading: postsLoading } = useUserPostsAll(username);

    const { data: savedPosts = [], refetch: savedPostsRefetch, isLoading: savedPostsLoading } = useGetSavedPosts(user.id);

    // Filter saved posts
    console.log("saved posts: ", savedPosts)
    console.log(allPosts.length, savedPosts.length)

    // Handle refresh
    const handleRefresh = useCallback(() => {
        refetch();
        savedPostsRefetch();
        fetchUserBio();
    }, [refetch, savedPostsRefetch]);

    // Function to limit bio text to 60 characters
    const limitBioText = (text: string) => {
        return text.slice(0, 60);
    };

    // Fetch user bio from Supabase
    const fetchUserBio = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('bio')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error fetching bio:', error);
                return;
            }

            if (data && data.bio) {
                setBio(data.bio);
            }
        } catch (error) {
            console.error('Error fetching bio:', error);
        }
    }, [user.id]);

    // Update bio in Supabase
    const updateBio = useCallback(async () => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ bio: newBio })
                .eq('id', user.id);

            if (error) {
                console.error('Error updating bio:', error);
                return;
            }

            setBio(newBio);
            setEditingBio(false);

            // Invalidate queries that may depend on this data
            queryClient.invalidateQueries(['user', user.id]);
        } catch (error) {
            console.error('Error updating bio:', error);
        }
    }, [newBio, user.id, queryClient]);

    // Open bio edit modal
    const handleEditBio = useCallback(() => {
        setEditingBio(true);
    }, [bio]);


    // Fetch bio on component mount
    React.useEffect(() => {
        fetchUserBio();
    }, [fetchUserBio]);

    const handleSeeAllPosts = useCallback(() => {
        navigation.navigate('AllPosts', { type: 'posts' });
    }, [navigation]);

    const handleSeeAllSavedPosts = useCallback(() => {
        navigation.navigate('AllPosts', { type: 'saved' });
    }, [navigation]);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error);
        } else {
            navigation.navigate('Login');
        }
    };

    // Render the profile header
    const ProfileHeader = useCallback(() => (
        <View style={styles.header}>
            <View style={styles.profileSection}>
                <View style={styles.userIcon}>
                    <MaterialIcons name="person" size={40} color="black" />
                </View>
                <View style={styles.userInfo}>
                    <CustomText style={styles.username}>@{username}</CustomText>
                    <View style={styles.bioContainer}>
                        <CustomText style={styles.bio}>{bio}</CustomText>
                        <TouchableOpacity onPress={handleEditBio} style={styles.editIcon}>
                            <MaterialIcons name="edit" size={16} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <CustomText style={styles.statNumber}>{allPosts.length || 0}</CustomText>
                    <CustomText style={styles.statLabel}>Posts</CustomText>
                </View>
                <TouchableOpacity
                    style={styles.statItem}
                    onPress={() => navigation.navigate('FollowList')}
                >
                    <MaterialIcons name="people" size={24} color={theme.colors.text} />
                    <CustomText style={styles.statLabel}>Friends</CustomText>
                </TouchableOpacity>
            </View>
        </View>
    ), [username, allPosts.length, bio, handleEditBio, navigation]);

    return (
        <>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={false}
                        onRefresh={handleRefresh}
                        tintColor={theme.colors.primary}
                        titleColor={theme.colors.primary}
                    />
                }
            >
                <ProfileHeader />
                <RecentPosts
                    data={allPosts}
                    onSeeAll={handleSeeAllPosts}
                    isLoading={postsLoading}
                />
                <SavedPosts
                    data={savedPosts}
                    onSeeAll={handleSeeAllSavedPosts}
                    isLoading={savedPostsLoading}
                />
                {/* <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <CustomText style={styles.logoutButtonText}>Log Out</CustomText>
                </TouchableOpacity> */}
            </ScrollView>

            {/* Bio Edit Modal */}
            <Modal
                visible={editingBio}
                transparent
                animationType="slide"
                onRequestClose={() => setEditingBio(false)}
            >
                <TouchableWithoutFeedback
                    onPress={() => {
                        Keyboard.dismiss();
                    }}
                >
                    <View style={styles.modalContainer}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={styles.modalContent}>
                                <CustomText style={styles.modalTitle}>Edit Bio</CustomText>

                                <TextInput
                                    style={styles.bioInput}
                                    value={newBio}
                                    onChangeText={(text) => {
                                        setNewBio(limitBioText(text));
                                    }} placeholder="Tell us about yourself"
                                    returnKeyType="done"
                                    onSubmitEditing={Keyboard.dismiss}
                                />

                                <View style={styles.bioCounter}>
                                    <CustomText style={styles.bioCounterText}>
                                        {newBio.length}/60
                                    </CustomText>
                                </View>

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => setEditingBio(false)}
                                    >
                                        <CustomText style={styles.buttonText}>Cancel</CustomText>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.saveButton]}
                                        onPress={updateBio}
                                    >
                                        <CustomText style={styles.buttonText}>Save</CustomText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.light_background_1,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    userIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    bioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bio: {
        fontSize: 14,
        color: theme.colors.light_background_2,
        lineHeight: 20,
        flex: 1,
    },
    editIcon: {
        padding: 5,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.light_background_3,
        marginTop: 4,
    },
    postItem: {
        flex: 1,
        aspectRatio: 1,
        margin: 1,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    listContent: {
        paddingTop: 0,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#666',
        fontSize: 16,
    },
    refreshButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 10,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingBottom: '30%',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: theme.colors.background,
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    bioInput: {
        borderWidth: 1,
        borderColor: theme.colors.light_background_1,
        borderRadius: 5,
        padding: 10,
        minHeight: 100,
        textAlignVertical: 'top',
        color: theme.colors.text,
    },
    bioCounter: {
        alignItems: 'flex-end',
        marginVertical: 5,
    },
    bioCounterText: {
        fontSize: 12,
        color: theme.colors.light_background_3,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    modalButton: {
        flex: 1,
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: theme.colors.light_background_1,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
    },
    buttonText: {
        fontWeight: 'bold',
        color: 'white',
    },
    logoutButton: {
        padding: 10,
        backgroundColor: theme.colors.primary,
        borderRadius: 5,
        alignItems: 'center',
        margin: 20,
    },
    logoutButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});