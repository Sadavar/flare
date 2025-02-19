import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

console.log("supabaseUrl", supabaseUrl)
console.log("supabaseAnonKey", supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})

// Add this function to check for duplicate posts
export const checkDuplicatePosts = async () => {
    try {
        console.log('🔍 Checking for duplicate posts...');

        // Fetch all posts
        const { data: posts, error } = await supabase
            .from('posts')
            .select('uuid')

        if (error) {
            console.error('❌ Error fetching posts:', error);
            return;
        }

        // Create a map to store UUID occurrences
        const uuidCounts = posts.reduce((acc: { [key: string]: number }, post) => {
            acc[post.uuid] = (acc[post.uuid] || 0) + 1;
            return acc;
        }, {});

        // Find duplicates (UUIDs that appear more than once)
        const duplicates = Object.entries(uuidCounts)
            .filter(([_, count]) => count > 1)
            .map(([uuid, count]) => ({ uuid, count }));

        if (duplicates.length > 0) {
            console.log('🚨 Found duplicate posts:');
            duplicates.forEach(({ uuid, count }) => {
                console.log(`UUID: ${uuid} appears ${count} times`);
            });
        } else {
            console.log('✅ No duplicate posts found');
        }

        console.log(`Total posts checked: ${posts.length}`);

    } catch (error) {
        console.error('❌ Error checking duplicates:', error);
    }
};

// You can call this function wherever needed, for example:
// checkDuplicatePosts();
