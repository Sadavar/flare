import { View, Text } from "react-native";
import MasonryList from '@react-native-seoul/masonry-list';
import { useGlobalFeed } from '@/hooks/usePostQueries';
import { Post } from '@/types';
import { useQueryClient } from '@tanstack/react-query';


export default function GlobalFeed2() {

    const { data } = useGlobalFeed(4);


    return (
        <View>
            <MasonryList
                data={[]}
                numColumns={2}
                renderItem={({ item }) => />}
            />
        </View>
    )
}