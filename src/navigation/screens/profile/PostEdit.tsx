import React from 'react';
import { View, Text } from 'react-native';

interface PostEditProps {
    postId: string;
}

export function PostEdit({ postId }: PostEditProps) {
    return (
        <View>
            <Text>Edit Post: {postId}</Text>
        </View>
    );
}