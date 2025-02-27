import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/context/SessionContext';

export function useRecentUsers(limit = 30) {
    const { user } = useSession();

    return useQuery({
        queryKey: ['recentUsers'],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('profiles')
                .select('id, username')
                // .neq('id', user.id) // Exclude current user
                .limit(limit);

            if (error) {
                console.error('Error fetching recent users:', error);
                throw error;
            }

            return data || [];
        },
        enabled: !!user?.id
    });
} 