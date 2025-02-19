import React from 'react';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { BrandsStackParamList, Post } from '@/types';
import { Layout } from '@/components/Layout';
import { PostView } from '@/components/PostView';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSession } from '@/context/SessionContext';
import { supabase } from '@/lib/supabase';


type PostDetailsRouteProp = RouteProp<BrandsStackParamList, 'PostDetails'>;
type PostDetailsNavigationProp = NativeStackNavigationProp<BrandsStackParamList, 'PostDetails'>;

export function PostDetails() {
    const route = useRoute<PostDetailsRouteProp>();
    const navigation = useNavigation<PostDetailsNavigationProp>();
    const { post }: { post: Post } = route.params;

    console.log('post', post);

    return (
        <PostView
            post={post}
        />
    );
} 