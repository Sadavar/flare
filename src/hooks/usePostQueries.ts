// hooks/usePostQueries.ts
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { Post, Style, Brand, Color } from '@/types';
import { useIsFocused } from '@react-navigation/native';

export const POST_SELECT_QUERY = `
    uuid,
    image_url,
    public_image_url,
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
    ),
    post_colors (
        colors (
            id,
            name,
            hex_value
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

// Updated to use infinite query with pagination and debug logs
export function useUserPosts(username: string, pageSize = 12) {
    const queryClient = useQueryClient();
    const [userUuid, setUserUuid] = useState<string | null>(null);
    const isActive = useRef(true);

    console.log('[useUserPosts] Initializing with username:', username, 'pageSize:', pageSize);

    // First get the user's UUID
    useEffect(() => {
        if (!username) return;
        isActive.current = true;
        console.log('[useUserPosts] Fetching user UUID for username:', username);

        const fetchUserUuid = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .single();

            if (error) {
                console.error('[useUserPosts] Error fetching user UUID:', error);
                return;
            }

            if (data && isActive.current) {
                console.log('[useUserPosts] Found user UUID:', data.id);
                setUserUuid(data.id);
            }
        };

        fetchUserUuid();

        return () => {
            console.log('[useUserPosts] Cleanup - setting isActive to false');
            isActive.current = false;
        };
    }, [username]);

    // Set up realtime subscription
    useEffect(() => {
        if (!userUuid) {
            console.log('[useUserPosts] Skipping subscription setup - no userUuid yet');
            return;
        }

        console.log('[useUserPosts] Setting up realtime subscription for userUuid:', userUuid);

        const channel: RealtimeChannel = supabase
            .channel(`user-posts-${username}`)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'posts',
                    filter: `user_uuid=eq.${userUuid}`
                },
                (payload) => {
                    console.log('[useUserPosts] Realtime change detected:', payload.eventType);
                    queryClient.invalidateQueries({ queryKey: ['userPosts', username] });
                }
            )
            .subscribe();

        return () => {
            console.log('[useUserPosts] Cleaning up subscription');
            channel.unsubscribe();
        };
    }, [username, userUuid, queryClient]);

    // Return an infinite query instead of a regular query
    const result = useInfiniteQuery({
        queryKey: ['userPosts', username],
        queryFn: async ({ pageParam = 0 }) => {
            console.log('[useUserPosts] QueryFn called with pageParam:', pageParam, 'pageSize:', pageSize);
            if (!username) {
                console.log('[useUserPosts] No username provided, returning empty array');
                return [];
            }
            const posts = await fetchUserPostsPage(username, pageParam, pageSize);
            console.log('[useUserPosts] Fetched page', pageParam, 'got', posts.length, 'posts');
            return posts;
        },
        getNextPageParam: (lastPage, allPages) => {
            const hasMore = lastPage.length === pageSize;
            const nextPage = hasMore ? allPages.length : undefined;
            console.log(
                '[useUserPosts] getNextPageParam -',
                'lastPageSize:', lastPage.length,
                'pageSize:', pageSize,
                'totalPages:', allPages.length,
                'hasMore:', hasMore,
                'nextPage:', nextPage
            );
            return nextPage;
        },
        initialPageParam: 0,
        enabled: !!username && !!userUuid
    });

    console.log(
        '[useUserPosts] Query state -',
        'isFetching:', result.isFetching,
        'isFetchingNextPage:', result.isFetchingNextPage,
        'hasNextPage:', result.hasNextPage,
        'pages count:', result.data?.pages?.length || 0,
        'total items:', result.data?.pages?.reduce((count, page) => count + page.length, 0) || 0
    );

    return result;
}

function useIsTabFocused(tabName: string) {
    const isFocused = useIsFocused();
    const [isTabMounted, setIsTabMounted] = useState(false);

    useEffect(() => {
        setIsTabMounted(true);
        return () => setIsTabMounted(false);
    }, []);

    return isFocused && isTabMounted;
}

export function useGlobalFeed(pageSize = 5) {
    const isTabFocused = useIsTabFocused('Global');
    const queryClient = useQueryClient();
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        // if (!isTabFocused) {
        //     // Clear the query cache when tab loses focus
        //     queryClient.removeQueries({ queryKey: ['globalFeed'] });
        //     return;
        // }

        // Subscribe to all post changes
        channelRef.current = supabase
            .channel('global-posts')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'posts'
                },
                (payload) => {
                    console.log('[useGlobalFeed] Realtime change detected:', payload.eventType);
                    queryClient.invalidateQueries({ queryKey: ['globalFeed'] });
                }
            )
            .subscribe();

        return () => {
            console.log('[useGlobalFeed] Cleaning up subscription');
            if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
            }
        };
    }, [isTabFocused, queryClient]);

    return useInfiniteQuery({
        queryKey: ['globalFeed'],
        queryFn: async ({ pageParam = 0 }) => {
            console.log('[useGlobalFeed] Fetching page:', pageParam);
            return fetchGlobalFeedPage(pageParam, pageSize);
        },
        getNextPageParam: (lastPage, allPages) => {
            const hasMore = lastPage.length === pageSize;
            return hasMore ? allPages.length : undefined;
        },
        initialPageParam: 0,
        enabled: isTabFocused,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnMount: true,
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
                    .remove([postId]),
                supabase
                    .from('post_colors')
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

// Moved from BrandsScreen - Query for brands
export function useBrands() {
    return useQuery<Brand[]>({
        queryKey: ['brands'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('brands')
                .select('id, name')
                .order('name');
            if (error) throw error;
            return data.map(brand => ({
                id: brand.id,
                name: brand.name,
                x_coord: null,
                y_coord: null,
            }));
        },
    });
}

// Moved from BrandsScreen - Query for styles
export function useStyles() {
    return useQuery<Style[]>({
        queryKey: ['styles'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('styles')
                .select('id, name')
                .order('name');
            if (error) throw error;
            return data;
        },
    });
}

export function useColors() {
    return useQuery<Color[]>({
        queryKey: ['colors'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('colors')
                .select('id, name, hex_value')
                .order('id', { ascending: true });

            if (error) throw error;
            return data;
        },
    });
}

// Moved from BrandsScreen - Function to fetch filtered posts by page
export function useFilteredPostsByStyles(selectedStyles: number[], pageSize = 10) {
    const isTabFocused = useIsTabFocused('Brands');
    const queryClient = useQueryClient();

    // useEffect(() => {
    //     if (!isTabFocused) {
    //         // Clear the query cache when tab loses focus
    //         queryClient.removeQueries({ queryKey: ['stylePosts', selectedStyles] });
    //     }
    // }, [isTabFocused, selectedStyles, queryClient]);

    const fetchFilteredPostsPage = useCallback(async (pageParam = 0) => {
        const from = pageParam * pageSize;
        const to = from + pageSize - 1;
        console.log('[useFilteredPostsByStyles] Fetching page:', pageParam, 'from:', from, 'to:', to, 'with styles:', selectedStyles);

        let postQuery = supabase
            .from('posts')
            .select(POST_SELECT_QUERY, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (selectedStyles.length > 0) {
            // Get posts that have ANY of the selected styles
            const { data: styleFilteredPosts, error: styleError } = await supabase
                .from('post_styles')
                .select('post_uuid')
                .in('style_id', selectedStyles);

            if (styleError) throw styleError;

            // Get unique post UUIDs
            const postUuids = [...new Set(styleFilteredPosts.map(post => post.post_uuid))];

            if (postUuids.length > 0) {
                postQuery = postQuery.in('uuid', postUuids);
            } else {
                return {
                    posts: [],
                    nextPage: undefined,
                    totalCount: 0
                };
            }
        }

        const { data, error, count } = await postQuery;
        console.log('[useFilteredPostsByStyles] Query response:', { dataLength: data?.length, error, count });
        if (error) throw error;

        // Process the posts and format them
        const formattedPosts = await Promise.all((data || []).map(async (post) => {
            return formatPost(post);
        }));

        return {
            posts: formattedPosts,
            nextPage: formattedPosts.length === pageSize ? pageParam + 1 : undefined,
            totalCount: count || 0
        };
    }, [selectedStyles, pageSize]);

    return useInfiniteQuery({
        queryKey: ['stylePosts', selectedStyles],
        queryFn: ({ pageParam = 0 }) => fetchFilteredPostsPage(pageParam),
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 0,
        enabled: isTabFocused,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnMount: true,
    });
}

// Helper functions

// New function to fetch paginated user posts with debugging
async function fetchUserPostsPage(username: string, page: number, pageSize: number) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    console.log('[fetchUserPostsPage] Starting fetch for range:', from, 'to', to);
    const startTime = Date.now();

    // First get the user UUID
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

    if (profileError) {
        console.error('[fetchUserPostsPage] Error fetching profile:', profileError);
        throw profileError;
    }

    if (!profileData?.id) {
        console.error('[fetchUserPostsPage] Could not find UUID for username:', username);
        return [];
    }

    console.log('[fetchUserPostsPage] Found userUuid:', profileData.id);

    // Then fetch the posts with the UUID
    const { data, error, count } = await supabase
        .from('posts')
        .select(POST_SELECT_QUERY, { count: 'exact' })
        .eq('user_uuid', profileData.id)
        .order('created_at', { ascending: false })
        .range(from, to);

    const endTime = Date.now();

    if (error) {
        console.error('[fetchUserPostsPage] Error fetching posts:', error);
        throw error;
    }

    console.log(
        '[fetchUserPostsPage] Response -',
        'items:', data.length,
        'total count:', count,
        'fetch time:', `${endTime - startTime}ms`,
        'from:', from,
        'to:', to
    );

    // Print the first and last item IDs for debugging
    if (data.length > 0) {
        console.log(
            '[fetchUserPostsPage] Range verification -',
            'first item created_at:', data[0].created_at,
            'last item created_at:', data[data.length - 1].created_at
        );
    }

    // Process posts and update public_image_url if needed
    const processedData = await Promise.all(data.map(updatePostWithPublicUrl));
    return processedData.map(formatPost);
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

    // Process posts and update public_image_url if needed
    const processedData = await Promise.all(data.map(updatePostWithPublicUrl));
    return processedData.map(formatPost);
}

// Reusable query functions
async function fetchPost(postId: string) {
    const { data, error } = await supabase
        .from('posts')
        .select(POST_SELECT_QUERY)
        .eq('uuid', postId)
        .single();

    if (error) throw error;

    // Update public_image_url if needed
    const processedPost = await updatePostWithPublicUrl(data);
    return formatPost(processedPost);
}

// Helper function to update post with public_image_url if it doesn't exist
async function updatePostWithPublicUrl(post: any): Promise<any> {
    if (post.public_image_url) {
        // Already has a public URL, just return the post
        return post;
    }

    // Generate public URL
    const publicUrl = supabase.storage
        .from('outfits')
        .getPublicUrl(post.image_url).data.publicUrl;

    // Update the post with the public URL
    const { error } = await supabase
        .from('posts')
        .update({ public_image_url: publicUrl })
        .eq('uuid', post.uuid);

    if (error) {
        console.error('[updatePostWithPublicUrl] Error updating public URL:', error);
        // Continue without failing, just use the generated URL
    } else {
        console.log('[updatePostWithPublicUrl] Updated public URL for post:', post.uuid);
    }

    // Return post with public_image_url added
    return {
        ...post,
        public_image_url: publicUrl
    };
}

// Helper function to format post data consistently
export function formatPost(post: any): Post {
    return {
        uuid: post.uuid,
        image_url: post.public_image_url,
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
        })),
        colors: post.post_colors.map((pc: any) => ({
            id: pc.colors.id,
            name: pc.colors.name,
            hex_value: pc.colors.hex_value
        }))
    };
}