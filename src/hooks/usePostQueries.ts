// hooks/usePostQueries.ts
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useRef, useState } from 'react';
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

    // Add staleTime and cacheTime to reduce refetching
    return useQuery<Post>({
        queryKey: ['post', postId],
        queryFn: () => fetchPost(postId),
        enabled: !!postId,
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        // Only refetch if window is refocused and data is stale
        refetchOnWindowFocus: 'always',
        // Don't refetch on reconnect unless stale
        refetchOnReconnect: false
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
                    .eq('post_uuid', postId),
                supabase.storage
                    .from('outfits')
                    .remove([postId])
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

export function useGlobalFeed(pageSize: number) {
    const isActive = useRef(true);

    const queryClient = useQueryClient();
    console.log('[useGlobalFeed] Initializing with pageSize:', pageSize);
    const invalidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced invalidation function
    const debouncedInvalidation = useCallback(() => {
        if (invalidationTimeoutRef.current) {
            clearTimeout(invalidationTimeoutRef.current);
        }

        invalidationTimeoutRef.current = setTimeout(() => {
            if (isActive.current) {
                queryClient.invalidateQueries({ queryKey: ['globalFeed'] });
            }
        }, 500); // 500ms debounce
    }, [queryClient]);

    useEffect(() => {
        isActive.current = true;
        const channel = supabase
            .channel('global-posts')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'posts' },
                () => {
                    if (isActive.current) {
                        debouncedInvalidation();
                    }
                }
            )
            .subscribe();

        return () => {
            isActive.current = false;
            if (invalidationTimeoutRef.current) {
                clearTimeout(invalidationTimeoutRef.current);
            }
            channel.unsubscribe();
        };
    }, [queryClient, debouncedInvalidation]);

    const result = useInfiniteQuery({
        queryKey: ['globalFeed'],
        queryFn: async ({ pageParam = 0 }) => {
            console.log('[useGlobalFeed] Fetching page:', pageParam, 'with pageSize:', pageSize);
            const result = await fetchGlobalFeedPage(pageParam, pageSize);
            console.log('[useGlobalFeed] Fetched page data. Items count:', result.length);
            return result;
        },
        getNextPageParam: (lastPage, allPages) => {
            const hasMore = lastPage.length === pageSize;
            const nextPage = hasMore ? allPages.length : undefined;
            console.log(
                '[useGlobalFeed] getNextPageParam -',
                'lastPageSize:', lastPage.length,
                'pageSize:', pageSize,
                'totalPages:', allPages.length,
                'hasMore:', hasMore,
                'nextPage:', nextPage
            );
            return nextPage;
        },
        initialPageParam: 0
    });

    console.log(
        '[useGlobalFeed] Query state -',
        'isFetching:', result.isFetching,
        'isFetchingNextPage:', result.isFetchingNextPage,
        'hasNextPage:', result.hasNextPage,
        'pages count:', result.data?.pages?.length || 0
    );

    return result;
}

// Updated fetch function with pagination and logging
async function fetchGlobalFeedPage(page: number, pageSize: number) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    console.log('[fetchGlobalFeedPage] Range request -', 'from:', from, 'to:', to);

    const startTime = Date.now();
    const { data, error, count } = await supabase
        .from('posts')
        .select(POST_SELECT_QUERY, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
    const endTime = Date.now();

    if (error) {
        console.error('[fetchGlobalFeedPage] Error fetching data:', error);
        throw error;
    }

    console.log(
        '[fetchGlobalFeedPage] Response -',
        'items:', data.length,
        'total count:', count,
        'fetch time:', `${endTime - startTime}ms`
    );

    // Print the first and last item IDs for debugging
    if (data.length > 0) {
        console.log(
            '[fetchGlobalFeedPage] Range verification -',
            'first item id:', data[0].uuid,
            'last item id:', data[data.length - 1].uuid
        );
    }

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
        brands: post.post_brands?.map((pb: any) => ({
            id: pb.brands.id,
            name: pb.brands.name,
            x_coord: pb.x_coord,
            y_coord: pb.y_coord
        })) || [],
        styles: post.post_styles?.map((ps: any) => ({
            id: ps.styles.id,
            name: ps.styles.name
        })) || []
    };
}

