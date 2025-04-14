import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface User {
    id: string;
    username: string;
}

interface UserSearchResponse {
    data: User[];
    nextPage: number | null;
    totalCount: number;
}

interface UserSearchInfiniteResponse {
    pages: UserSearchResponse[];
    pageParams: number[];
}

export function useUserSearch(searchQuery: string, pageSize = 5) {
    return useInfiniteQuery<UserSearchResponse, Error, UserSearchInfiniteResponse, string[], number>({
        queryKey: ['userSearch', searchQuery],
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            if (!searchQuery.trim()) return { data: [], nextPage: null, totalCount: 0 };

            const { data, error, count } = await supabase
                .from('profiles')
                .select('id, username', { count: 'exact' })
                .ilike('username', `%${searchQuery}%`)
                .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1)
                .order('username', { ascending: true });

            if (error) throw error;

            return {
                data: data || [],
                nextPage: data?.length === pageSize ? pageParam + 1 : null,
                totalCount: count || 0
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        enabled: !!searchQuery.trim(),
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    });
} 