module.exports = ({ config }) => {
    return {
        ...config,
        name: 'Flare',
        slug: 'flare',
        version: '1.0.1',
        orientation: 'portrait',
        icon: './assets/icon.png',
        userInterfaceStyle: 'dark',
        newArchEnabled: true,
        scheme: 'flare',
        extra: {
            supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
            supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
            eas: {
                projectId: 'a839f72d-c218-4c78-8bd7-4198fc41c884'
            }
        },
        ios: {
            supportsTablet: true,
            newArchEnabled: true,
            bundleIdentifier: 'com.flareapp.flare',
            icon: "./assets/icon.png"
        },
        android: {
            package: 'com.flareapp.flare',
            adaptiveIcon: {
                foregroundImage: "./assets/icon.png",
                backgroundColor: "#131418",
                bundleIdentifier: "com.flareapp.flare"
            },
        },
        web: {
            favicon: "./assets/icon.png"
        },
        plugins: [
            "expo-asset",
            [
                "expo-splash-screen",
                {
                    backgroundColor: "#131418",
                    image: "./assets/icon.png",
                    dark: {
                        image: "./assets/icon.png",
                        backgroundColor: "#131418"
                    },
                    imageWidth: 200
                }
            ],
            "react-native-edge-to-edge"
        ]
    };
};