import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Style {
    id: number;
    name: string;
}

interface StyleSearchResponse {
    data: Style[];
    nextPage: number | null;
    totalCount: number;
}

interface StyleSearchInfiniteResponse {
    pages: StyleSearchResponse[];
    pageParams: number[];
}

export function useStyleSearch(searchQuery: string, pageSize = 5) {
    return useInfiniteQuery<StyleSearchResponse, Error, StyleSearchInfiniteResponse, string[], number>({
        queryKey: ['styleSearch', searchQuery],
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            if (!searchQuery.trim()) return { data: [], nextPage: null, totalCount: 0 };

            const { data, error, count } = await supabase
                .from('styles')
                .select('id, name', { count: 'exact' })
                .ilike('name', `%${searchQuery}%`)
                .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1)
                .order('name', { ascending: true });

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