import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ProfileStackParamList } from '@/types';
import { PaginatedGridList } from '@/components/PaginatedGridList';
import { PostView } from '@/components/PostView';
import { useUserPostsAll, useGetSavedPosts } from '@/hooks/usePostQueries';
import { useSession } from '@/context/SessionContext';
import PostCard from '@/components/PostCard';
import { CustomText } from '@/components/CustomText';

type AllPostsRouteProp = RouteProp<ProfileStackParamList, 'AllPosts'>;

export function AllPosts() {
    const route = useRoute<AllPostsRouteProp>();
    const { type = 'posts' } = route.params;
    const { user, username } = useSession();

    // Get posts based on type
    const { data: userPosts = [], isLoading: isUserPostsLoading } = useUserPostsAll(username || '');
    const { data: savedPosts = [], isLoading: isSavedPostsLoading } = useGetSavedPosts(user?.id);

    const posts = type === 'saved' ? savedPosts : userPosts;
    const isLoading = type === 'saved' ? isSavedPostsLoading : isUserPostsLoading;

    return (
        <View style={styles.container}>
            <PaginatedGridList
                data={posts}
                renderItem={({ item }) => <PostCard post={item} />}
                numColumns={2}
                keyExtractor={(item) => item.uuid}
                isLoading={isLoading}
                emptyComponent={
                    <CustomText style={styles.emptyText}>
                        {type === 'saved' ? 'No saved posts yet' : 'No posts yet'}
                    </CustomText>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#666',
        fontSize: 16,
    },
}); 