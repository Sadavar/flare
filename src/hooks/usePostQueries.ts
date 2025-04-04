// hooks/usePostQueries.ts
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { Post, Style, Brand, Color } from '@/types';
import { useIsFocused } from '@react-navigation/native';
import { useSession } from '@/context/SessionContext';
import { useMutation } from '@tanstack/react-query';

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

export function useUserId(username: string) {
    return useQuery({
        queryKey: ['userId', username],
        queryFn: async () => {
            const { data, error } = await supabase.from('profiles').select('id').eq('username', username).single();
            if (error) throw error;
            return data.id;
        },
        enabled: !!username
    });
}

export function useUserPostsAll(username: string) {
    const { user } = useSession();
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ['userPostsAll', username],
        queryFn: async () => {
            if (!username) return [];

            // First get the user's UUID from their username
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .single();

            if (profileError) throw profileError;
            if (!profileData?.id) return [];

            // Fetch all posts for the user
            const { data: posts, error } = await supabase
                .from('posts')
                .select(POST_SELECT_QUERY)
                .eq('user_uuid', profileData.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!posts) return [];

            // Get saved status for these posts if there's a logged-in user
            const postsWithSavedStatus = await checkSavedStatus(posts, user?.id);
            return postsWithSavedStatus.map(formatPost);
        },
        enabled: !!username
    });
}

// Updated to use infinite query with pagination and debug logs
export function useUserPosts(username: string, pageSize = 12) {
    const queryClient = useQueryClient();
    const [userUuid, setUserUuid] = useState<string | null>(null);
    const isActive = useRef(true);

    // First get the user's UUID
    useEffect(() => {
        if (!username) return;
        isActive.current = true;

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
                setUserUuid(data.id);
            }
        };

        fetchUserUuid();

        return () => {
            isActive.current = false;
        };
    }, [username]);

    // Set up realtime subscription
    useEffect(() => {
        if (!userUuid) {
            return;
        }


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
                    queryClient.invalidateQueries({ queryKey: ['userPosts', username] });
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [username, userUuid, queryClient]);

    // Return an infinite query instead of a regular query
    const result = useInfiniteQuery({
        queryKey: ['userPosts', username],
        queryFn: async ({ pageParam = 0 }) => {
            if (!username) {
                return [];
            }
            const posts = await fetchUserPostsPage(username, pageParam, pageSize, userUuid);
            return posts;
        },
        getNextPageParam: (lastPage, allPages) => {
            const hasMore = lastPage.length === pageSize;
            const nextPage = hasMore ? allPages.length : undefined;
            return nextPage;
        },
        initialPageParam: 0,
        enabled: !!username && !!userUuid
    });

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

// Modify the useGlobalFeed hook to pass the user
export function useGlobalFeed(pageSize = 5) {
    const isTabFocused = useIsTabFocused('Global');
    const { user } = useSession();  // Get user here in the hook

    return useInfiniteQuery({
        queryKey: ['globalFeed'],
        queryFn: async ({ pageParam = 0 }) => {
            return fetchGlobalFeedPage(pageParam, pageSize, user?.id);
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
            // First get the image path
            const { data: postData, error: fetchError } = await supabase
                .from('posts')
                .select('image_url')
                .eq('uuid', postId)
                .single();

            if (fetchError) throw fetchError;

            // Delete related entries and the image file
            await Promise.all([
                supabase
                    .from('post_brands')
                    .delete()
                    .eq('post_uuid', postId),
                supabase
                    .from('post_styles')
                    .delete()
                    .eq('post_uuid', postId),
                supabase
                    .from('post_colors')
                    .delete()
                    .eq('post_uuid', postId),
                supabase
                    .from('post_pending_brands')
                    .delete()
                    .eq('post_uuid', postId),
                supabase
                    .from('saved_posts')
                    .delete()
                    .eq('post_uuid', postId),
                // Only attempt to delete the file if image_url exists
                postData.image_url ? supabase.storage
                    .from('outfits')
                    .remove([postData.image_url]) : Promise.resolve()
            ]);

            // Finally delete the post
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('uuid', postId);

            if (error) throw error;

            // Invalidate queries to refresh data
            queryClient.invalidateQueries(['posts']);

            return { success: true };
        } catch (error: any) {
            console.error('Error deleting post:', error);
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
async function fetchUserPostsPage(username: string, page: number, pageSize: number, userId: string) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const startTime = Date.now();

    // First get the user UUID
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

    if (profileError) {
        throw profileError;
    }

    if (!profileData?.id) {
        return [];
    }


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

    const postsWithSavedStatus = await checkSavedStatus(data, userId);
    return postsWithSavedStatus.map(formatPost);
}


// Modify the fetch function to accept userId
async function fetchGlobalFeedPage(page: number, pageSize: number, userId?: string) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

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


    const postsWithSavedStatus = await checkSavedStatus(data, userId);
    return postsWithSavedStatus.map(formatPost);
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


    // Return post with public_image_url added
    return {
        ...post,
        public_image_url: publicUrl
    };
}

export function usePostsWithBrandFeed(brandId: number, pageSize = 5) {
    const isTabFocused = useIsTabFocused('Brands');
    const queryClient = useQueryClient();

    return useInfiniteQuery({
        queryKey: ['postsWithBrandFeed', brandId],
        queryFn: async ({ pageParam = 0 }) => {
            return fetchPostsWithBrandFeedPage(brandId, pageParam, pageSize);
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

async function fetchPostsWithBrandFeedPage(brandId: number, page: number, pageSize: number) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const startTime = Date.now();

    // First get the post UUIDs that have this brand
    const { data: brandPosts, error: brandError } = await supabase
        .from('post_brands')
        .select('post_uuid')
        .eq('brand_id', brandId);

    if (brandError) {
        console.error('[fetchPostsWithBrandFeedPage] Error fetching brand posts:', brandError);
        throw brandError;
    }

    // Get unique post UUIDs
    const postUuids = [...new Set(brandPosts.map(post => post.post_uuid))];

    if (postUuids.length === 0) {
        console.log('[fetchPostsWithBrandFeedPage] No posts found for brand');
        return [];
    }

    // Then fetch the full post data for these UUIDs
    const { data, error, count } = await supabase
        .from('posts')
        .select(POST_SELECT_QUERY, { count: 'exact' })
        .in('uuid', postUuids)
        .order('created_at', { ascending: false })
        .range(from, to);

    const endTime = Date.now();

    if (error) {
        console.error('[fetchPostsWithBrandFeedPage] Error fetching posts:', error);
        throw error;
    }

    if (!data) return [];

    // Process posts and update public_image_url if needed
    return data.map(formatPost);
}

// Helper function to format post data consistently
export function formatPost(post: any): Post {
    return {
        uuid: post.uuid,
        image_url: post.public_image_url,
        description: post.description,
        // user_uuid: post.
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
        })),
        saved: post.saved || false
    };
}

// Add this utility function
async function getSavedPosts(userId: string, postUuids?: string[]) {
    if (!userId) return [];

    let query = supabase
        .from('saved_posts')
        .select(`
            post_uuid,
            posts (
                ${POST_SELECT_QUERY}
            )
        `)
        .eq('user_uuid', userId);

    // If postUuids is provided, filter to only those posts
    if (postUuids && postUuids.length > 0) {
        query = query.in('post_uuid', postUuids);
    }

    const { data: savedPosts, error } = await query;

    if (error) {
        console.error('Error fetching saved posts:', error);
        throw error;
    }

    return savedPosts || [];
}

export function useNumSavedYourPosts(username: string) {
    return useQuery({
        queryKey: ['numSavedYourPosts', username],
        queryFn: async () => {
            const { data: userId, error: userIdError } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .single();

            if (userIdError) {
                console.error('Error fetching user ID:', userIdError);
                throw userIdError;
            }

            const { data: savedPosts, error: savedPostsError } = await supabase
                .from('saved_posts')
                .select('post_uuid')

            if (savedPostsError) {
                console.error('Error fetching saved posts:', savedPostsError);
                throw savedPostsError;
            }


            // Check if the saved posts belong to the user
            const postUuids = savedPosts.map(sp => sp.post_uuid);
            const { data: posts, error: postsError } = await supabase
                .from('posts')
                .select('user_uuid')
                .in('uuid', postUuids);


            if (postsError) {
                console.error('Error fetching posts:', postsError);
                throw postsError;
            }

            // Count the number of posts that belong to the user
            const savedPostCount = posts.filter(post => post.user_uuid === userId.id).length;
            return savedPostCount;
        },
        enabled: !!username
    });
}

// Update checkSavedStatus to use getSavedPosts
async function checkSavedStatus(posts: any[], userId: string | undefined) {
    console.log('checkSavedStatus called with:', {
        numberOfPosts: posts?.length || 0,
        userId: userId || 'undefined'
    });

    if (!userId || !posts.length) {
        console.log('Early return due to:', {
            noUserId: !userId,
            noPosts: !posts.length
        });
        return posts;
    }

    // Log post UUIDs being checked
    console.log('Checking saved status for posts:', posts.map(post => post.uuid));

    // Get saved status using getSavedPosts
    const savedPosts = await getSavedPosts(userId, posts.map(post => post.uuid));
    console.log('Retrieved saved posts:', {
        count: savedPosts.length,
        savedPosts
    });

    // Create a Set of saved post UUIDs for efficient lookup
    const savedPostIds = new Set(savedPosts.map(sp => sp.post_uuid));
    console.log('Created Set of saved post IDs:', {
        count: savedPostIds.size,
        savedPostIds: Array.from(savedPostIds)
    });

    // Add saved status to each post
    const posts_with_save = posts.map(post => {
        const isSaved = savedPostIds.has(post.uuid);
        console.log(`Post ${post.uuid} saved status:`, isSaved);
        return {
            ...post,
            saved: isSaved
        };
    });

    console.log('Returning posts with save status:', {
        count: posts_with_save.length,
    });

    return posts_with_save;
}
// Add a hook to get a user's saved posts
export function useGetSavedPosts(userId: string | undefined) {
    return useQuery({
        queryKey: ['savedPosts', userId],
        queryFn: async () => {
            if (!userId) {
                console.log('No userId provided to useGetSavedPosts');
                return [];
            }

            try {
                // Get saved posts with their full post data
                const savedPosts = await getSavedPosts(userId);
                if (!savedPosts) return [];

                // Extract just the posts and ensure they exist
                const posts = savedPosts
                    .map(sp => sp.posts)
                    .filter(Boolean);

                // These posts are all saved since they come from saved_posts table
                const formattedPosts = posts.map(post => formatPost({
                    ...post,
                    saved: true
                }));

                console.log("Formatted saved posts:", formattedPosts);
                return formattedPosts;
            } catch (error) {
                console.error('Error in useGetSavedPosts:', error);
                return [];
            }
        },
        enabled: !!userId
    });
}

// Fix for useSavePost function
export function useSavePost() {
    const { user } = useSession();  // Make sure we're getting the user object
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ post, saved }: { post: Post; saved: boolean }) => {
            console.log("Save post mutation starting");
            console.log("Post:", post);
            console.log("Current saved status:", saved);
            console.log("User ID:", user?.id);

            if (!user) {
                throw new Error('Must be logged in to save posts');
            }

            // Adding better validation
            if (!post.uuid) {
                throw new Error('Invalid post: missing UUID');
            }

            // Don't check if it's the user's own post - this validation should be
            // handled in the UI layer, and it might be causing issues here

            try {
                if (saved) {
                    console.log(`Removing saved post ${post.uuid} for user ${user.id}`);
                    const { error } = await supabase
                        .from('saved_posts')
                        .delete()
                        .eq('post_uuid', post.uuid)
                        .eq('user_uuid', user.id);

                    if (error) throw error;
                    console.log("Successfully removed saved post");
                } else {
                    console.log(`Adding saved post ${post.uuid} for user ${user.id}`);
                    const { error } = await supabase
                        .from('saved_posts')
                        .insert({
                            post_uuid: post.uuid,
                            user_uuid: user.id
                        });

                    if (error) {
                        console.error("Error saving post:", error);
                        throw error;
                    }
                    console.log("Successfully added saved post");
                }

                // Return the result to update the UI immediately
                return { success: true, isSaved: !saved };
            } catch (error) {
                console.error("Save post mutation error:", error);
                throw error;
            }
        },
        onSuccess: (data, variables) => {
            // Update specific queries to ensure the UI reflects changes
            console.log("Save mutation succeeded, invalidating queries");

            // Update the specific post data in the cache
            queryClient.setQueryData(['post', variables.post.uuid], (oldData: any) => {
                if (oldData) {
                    return {
                        ...oldData,
                        saved: !variables.saved
                    };
                }
                return oldData;
            });

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
            queryClient.invalidateQueries({ queryKey: ['globalFeed'] });
            queryClient.invalidateQueries({ queryKey: ['userPosts'] });
            queryClient.invalidateQueries({ queryKey: ['userPostsAll'] });
        },
        onError: (error) => {
            console.error("Save post mutation failed:", error);
        }
    });
}

export function useFollowingFeed(pageSize = 10) {
    const { user } = useSession();

    return useInfiniteQuery({
        queryKey: ['followingFeed', user?.id],
        queryFn: async ({ pageParam = 0 }) => {
            if (!user?.id) return [];

            // First get all users we're following
            const { data: following } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', user.id);

            if (!following?.length) {
                console.log('User is not following anyone');
                return [];
            }

            const followingIds = following.map(f => f.following_id);
            console.log('Following IDs:', followingIds);

            // Then get posts from those users
            const { data: posts, error } = await supabase
                .from('posts')
                .select(POST_SELECT_QUERY)
                .in('user_uuid', followingIds) // Only get posts from followed users
                .order('created_at', { ascending: false })
                .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1);

            if (error) {
                console.error('Error fetching following feed:', error);
                return [];
            }

            if (!posts || posts.length === 0) {
                console.log('No posts found from followed users');
                return [];
            }

            console.log(`Found ${posts.length} posts from followed users`);

            // Add saved status
            const postsWithSavedStatus = await checkSavedStatus(posts, user.id);
            return postsWithSavedStatus.map(formatPost);
        },
        getNextPageParam: (lastPage, allPages) => {
            const hasMore = lastPage.length === pageSize;
            return hasMore ? allPages.length : undefined;
        },
        initialPageParam: 0,
        enabled: !!user?.id
    });
}

