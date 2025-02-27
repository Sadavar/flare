import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useUserSearch(searchQuery: string) {
    return useQuery({
        queryKey: ['userSearch', searchQuery],
        queryFn: async () => {
            if (!searchQuery.trim()) return [];

            const { data, error } = await supabase
                .from('profiles')
                .select('id, username')
                .ilike('username', `%${searchQuery}%`)
                .limit(20);

            if (error) throw error;
            return data || [];
        },
        enabled: !!searchQuery.trim()
    });
} 