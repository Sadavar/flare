module.exports = {
    expo: {
        name: 'Flare',
        slug: 'flare',
        // ... other expo config
        extra: {
            supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
            supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
            eas: {
                projectId: 'a839f72d-c218-4c78-8bd7-4198fc41c884'
            }
        },
        ios: {
            bundleIdentifier: 'com.flare.flare',
        },
        "android": {
            "package": "com.flare.flare"
        }
    },
}; 