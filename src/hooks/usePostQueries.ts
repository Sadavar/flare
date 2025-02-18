// hooks/usePostQueries.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { Post } from '@/types';

export const POST_SELECT_QUERY = `
    uuid,
    image_url,
    description,
    created_at,
    profiles!posts_user_uuid_fkey (username),
    post_brands (
        brands (
            id,
            name
        ),
        x_coord,
        y_coord
    ),
    post_styles (
        styles (
            id,
            name
        )
    )
`;

export function usePost(postId: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!postId) return;

        // Subscribe to changes for a specific post
        const channel: RealtimeChannel = supabase
            .channel(`post-${postId}`)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'posts',
                    filter: `uuid=eq.${postId}`
                },
                (payload) => {
                    if (payload.eventType === 'DELETE') {
                        queryClient.setQueryData(['post', postId], null);
                    } else {
                        // Refetch to get the complete post data with relations
                        queryClient.invalidateQueries({ queryKey: ['post', postId] });
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [postId, queryClient]);

    return useQuery<Post>({
        queryKey: ['post', postId],
        queryFn: () => fetchPost(postId),
        enabled: !!postId
    });
}

export function useUserPosts(username: string) {
    const queryClient = useQueryClient();
    const [userUuid, setUserUuid] = useState<string | null>(null);

    // First get the user's UUID
    useEffect(() => {
        if (!username) return;

        const fetchUserUuid = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('uuid')
                .eq('username', username)
                .single();
            if (data) {
                setUserUuid(data.uuid);
            }
        };

        fetchUserUuid();
    }, [username]);

    // Then set up the subscription with the UUID
    useEffect(() => {
        if (!userUuid) return;

        const channel: RealtimeChannel = supabase
            .channel(`user-posts-${username}`)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'posts',
                    filter: `user_uuid=eq.${userUuid}`
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['userPosts', username] });
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [username, userUuid, queryClient]);

    return useQuery<Post[]>({
        queryKey: ['userPosts', username],
        queryFn: () => fetchUserPosts(username),
        enabled: !!username
    });
}

export function useGlobalFeed() {
    const queryClient = useQueryClient();

    useEffect(() => {
        // Subscribe to all post changes
        const channel: RealtimeChannel = supabase
            .channel('global-posts')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'posts'
                },
                () => {
                    // Refetch the global feed when any changes occur
                    queryClient.invalidateQueries({ queryKey: ['globalFeed'] });
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [queryClient]);

    return useQuery<Post[]>({
        queryKey: ['globalFeed'],
        queryFn: fetchGlobalFeed
    });
}

export function useDeletePost() {
    const queryClient = useQueryClient();

    const deletePost = async (postId: string) => {
        try {
            // Delete post_brands and post_styles entries first
            await Promise.all([
                supabase
                    .from('post_brands')
                    .delete()
                    .eq('post_uuid', postId),
                supabase
                    .from('post_styles')
                    .delete()
                    .eq('post_uuid', postId)
            ]);

            // Then delete the post
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('uuid', postId);

            if (error) throw error;

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    };

    return { deletePost };
}

// Reusable query functions
async function fetchPost(postId: string) {
    const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT_QUERY)
        .eq('uuid', postId)
        .single();

    if (error) throw error;

    return formatPost(data);
}

async function fetchGlobalFeed() {
    const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT_QUERY)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(formatPost);
}

async function fetchUserPosts(username: string) {
    const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT_QUERY)
        .eq('profiles.username', username)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(formatPost);
}

// Helper function to format post data consistently
export function formatPost(post: any): Post {
    return {
        uuid: post.uuid,
        image_url: supabase.storage
            .from('outfits')
            .getPublicUrl(post.image_url).data.publicUrl,
        description: post.description,
        username: post.profiles.username,
        created_at: post.created_at,
        brands: post.post_brands.map((pb: any) => ({
            id: pb.brands.id,
            name: pb.brands.name,
            x_coord: pb.x_coord,
            y_coord: pb.y_coord
        })),
        styles: post.post_styles.map((ps: any) => ({
            id: ps.styles.id,
            name: ps.styles.name
        }))
    };
}