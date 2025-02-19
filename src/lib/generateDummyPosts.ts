import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { decode } from 'base64-js';

// Sample data for random generation
const sampleBrands = [
    { id: 3, name: 'Fugazi' },
    { id: 12, name: 'Madhappy' },
    { id: 13, name: 'Diesel' },
];

const sampleStyles = [
    { id: 1, name: 'Casual' },
    { id: 2, name: 'Sporty' },
    { id: 3, name: 'Formal' },
    { id: 4, name: 'Street' },
    { id: 5, name: 'Minimal' }
];

// Sample image URLs - using just the file paths now
const sampleImages = [
    'outfits/d517ed74-5bfe-4e3f-b2ec-e06549ec43ee/97e58bd7-b66c-45e5-8287-c2dcdb18a393.jpg',
    'outfits/d517ed74-5bfe-4e3f-b2ec-e06549ec43ee/b8052978-629a-440b-8a75-f73a655ce7df.jpg',
    'outfits/d517ed74-5bfe-4e3f-b2ec-e06549ec43ee/d96b04d2-a659-43f0-8325-1a8f6b48e763.jpg',
];

async function generateDummyPosts(count: number, userUuid: string) {
    console.log('Starting dummy post generation...');
    console.log(count, userUuid);

    for (let i = 0; i < count; i++) {
        console.log(`Starting post ${i + 1}/${count}`);

        try {
            // 1. Create the post and get its UUID
            const { data: postData, error: postError } = await supabase
                .from('posts')
                .insert([{
                    user_uuid: userUuid,
                    image_url: sampleImages[Math.floor(Math.random() * sampleImages.length)],
                    description: `Test post ${i + 1} - This is a dummy post for testing pagination.`,
                }])
                .select('uuid')
                .single();

            if (postError) throw postError;
            if (!postData) throw new Error('No post data returned');

            console.log(`Created post ${i + 1} with UUID: ${postData.uuid}`);

            // 2. Add random brands (1-3 brands per post)
            const numBrands = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < numBrands; j++) {
                const brand = sampleBrands[j];
                const { error: brandError } = await supabase
                    .from('post_brands')
                    .insert({
                        post_uuid: postData.uuid,
                        brand_id: brand.id,
                        x_coord: Math.floor(Math.random() * 100),
                        y_coord: Math.floor(Math.random() * 100)
                    });

                if (brandError) throw brandError;
            }

            // 3. Add random styles (1-2 styles per post)
            const numStyles = Math.floor(Math.random() * 2) + 1;
            for (let j = 0; j < numStyles; j++) {
                const style = sampleStyles[Math.floor(Math.random() * sampleStyles.length)];
                const { error: styleError } = await supabase
                    .from('post_styles')
                    .insert({
                        post_uuid: postData.uuid,
                        style_id: style.id
                    });

                if (styleError) throw styleError;
            }

            console.log(`Completed post ${i + 1}/${count}`);

        } catch (error) {
            console.error(`Error creating post ${i + 1}:`, error);
        }
    }

    console.log('Finished generating dummy posts!');
}

// Function to clean up dummy posts
async function cleanupDummyPosts(userUuid: string) {
    console.log('Cleaning up dummy posts...');

    try {
        // Get all posts with their image_urls
        const { data: posts } = await supabase
            .from('posts')
            .select('uuid, image_url')
            .eq('user_uuid', userUuid);

        if (!posts || !posts.length) return;

        const postUuids = posts.map(post => post.uuid);

        // Delete related records first
        await Promise.all([
            supabase.from('post_brands').delete().in('post_uuid', postUuids),
            supabase.from('post_styles').delete().in('post_uuid', postUuids)
        ]);

        // Delete images from storage
        const storagePromises = posts.map(post => {
            // Extract the file path from the full URL
            // Example URL: https://...supabase.co/storage/v1/object/public/outfits/outfits/uuid/filename.jpg
            const urlParts = post.image_url.split('/outfits/');
            if (urlParts.length > 1) {
                const filePath = `outfits/${urlParts[1]}`;
                return supabase.storage
                    .from('outfits')
                    .remove([filePath]);
            }
            return Promise.resolve();
        });

        // Wait for storage deletions to complete
        await Promise.all(storagePromises);

        // Then delete the posts
        await supabase.from('posts').delete().in('uuid', postUuids);

        console.log('Cleanup complete! Deleted:', {
            posts: postUuids.length,
            images: posts.length
        });
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

export { generateDummyPosts, cleanupDummyPosts }; 