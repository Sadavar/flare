import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/context/SessionContext';

// Check if currentUser is following targetUser
export function useIsFollowing(targetUserId: string) {
    const { user } = useSession();

    return useQuery({
        queryKey: ['following', user?.id, targetUserId],
        queryFn: async () => {
            if (!user?.id || !targetUserId) return false;

            const { data, error } = await supabase
                .from('follows')
                .select('*')
                .eq('follower_id', user.id)
                .eq('following_id', targetUserId);

            // Log for debugging
            console.log("Follow check result:", { data, error });

            if (error) {
                console.error('Error checking follow status:', error);
                return false;
            }

            // Check if we have any matching rows
            return data && data.length > 0;
        },
        enabled: !!user?.id && !!targetUserId
    });
}

// Follow/Unfollow mutation
export function useFollowUser() {
    const { user } = useSession();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            targetUserId,
            isFollowing
        }: {
            targetUserId: string;
            isFollowing: boolean;
        }) => {
            if (!user?.id) throw new Error('Must be logged in to follow users');

            if (isFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', targetUserId);

                if (error) throw error;
            } else {
                // Follow
                const { error } = await supabase
                    .from('follows')
                    .insert({
                        follower_id: user.id,
                        following_id: targetUserId
                    });

                if (error) throw error;
            }
        },
        onMutate: async ({ targetUserId, isFollowing }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['following', user?.id] });
            await queryClient.cancelQueries({ queryKey: ['followers', targetUserId] });

            // Snapshot the previous value
            const previousFollowing = queryClient.getQueryData(['following', user?.id]);

            // Optimistically update the following list
            queryClient.setQueryData(['following', user?.id], (old: any[]) => {
                if (isFollowing) {
                    // Remove from following list
                    return old?.filter(f => f.profiles.id !== targetUserId) || [];
                } else {
                    // Add to following list
                    return [...(old || []), {
                        following_id: targetUserId,
                        profiles: {
                            id: targetUserId,
                            // You might want to pass the username through the mutation
                            username: 'loading...'
                        }
                    }];
                }
            });

            return { previousFollowing };
        },
        onError: (err, { targetUserId }, context) => {
            console.error('Follow mutation failed:', err);
            // Rollback to the previous value
            queryClient.setQueryData(
                ['following', user?.id],
                context?.previousFollowing
            );
        },
        onSettled: (_, __, { targetUserId }) => {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['followers', targetUserId] });
        }
    });
} 