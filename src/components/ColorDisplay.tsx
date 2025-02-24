
import { Post } from '@/types'
import { View, StyleSheet, ScrollView } from 'react-native'
import { ColorCard } from './ColorCard'

export default function ColorDisplay({ post }: { post: Post }) {
    if (!post || !post.colors || post.colors.length <= 0) {
        return
    }
    return (
        <View style={styles.colorsContainer}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colorsList}
            >
                {post.colors.map((color) => (
                    <ColorCard key={color.id} color={color} />
                ))}
            </ScrollView>
        </View>
    )
}
const styles = StyleSheet.create({
    colorsContainer: {
        paddingVertical: 15,
    },
    colorsList: {
        paddingHorizontal: 15,
        paddingBottom: 15,
        gap: 12,
        flexDirection: 'row',
    },
})