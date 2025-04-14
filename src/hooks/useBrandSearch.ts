import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface Brand {
    id: number;
    name: string;
}

interface BrandSearchResponse {
    data: Brand[];
    nextPage: number | null;
    totalCount: number;
}

interface BrandSearchInfiniteResponse {
    pages: BrandSearchResponse[];
    pageParams: number[];
}

export function useBrandSearch(searchQuery: string, pageSize = 10) {
    return useInfiniteQuery<BrandSearchResponse, Error, BrandSearchInfiniteResponse, string[], number>({
        queryKey: ['brandSearch', searchQuery],
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            if (!searchQuery.trim()) return { data: [], nextPage: null, totalCount: 0 };

            const { data, error, count } = await supabase
                .from('brands')
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