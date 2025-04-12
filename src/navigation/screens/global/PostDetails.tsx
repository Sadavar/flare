import React from 'react';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { BrandsStackParamList } from '@/types';
import { PostView } from '@/components/PostView';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';


type PostDetailsRouteProp = RouteProp<BrandsStackParamList, 'PostDetails'>;
type PostDetailsNavigationProp = NativeStackNavigationProp<BrandsStackParamList, 'PostDetails'>;

export function PostDetails() {
    const route = useRoute<PostDetailsRouteProp>();
    const navigation = useNavigation<PostDetailsNavigationProp>();
    const { post, viewType } = route.params;

    console.log("viewtype", viewType)
    return (
        <PostView
            post={post}
            viewType={viewType}
        />
    );
} 