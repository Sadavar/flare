import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ProfileStackParamList } from '@/types';
import { PaginatedGridList } from '@/components/PaginatedGridList';
import { useUserPostsAll } from '@/hooks/usePostQueries';
import PostCard from '@/components/PostCard';
import { CustomText } from '@/components/CustomText';

type UserAllPostsRouteProp = RouteProp<ProfileStackParamList, 'UserAllPosts'>;

export function UserAllPosts() {
    const route = useRoute<UserAllPostsRouteProp>();
    const { username } = route.params;

    const { data: posts = [], isLoading } = useUserPostsAll(username);

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
                        No posts yet
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