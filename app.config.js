// app.config.js
module.exports = ({ config }) => {
return {
    ...config,
    name: 'Flare',
    slug: 'flare',
    version: '1.0.1',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    scheme: 'flare',

    extra: {
        eas: {
            projectId: 'a66c90a5-d8d6-4f05-bf5c-aac464c99646'
        }
    },

    ios: {
        supportsTablet: true,
        newArchEnabled: true,
        bundleIdentifier: 'com.flareapp.flare',
        icon: './assets/icon.png'
    },
    android: {
        package: 'com.flareapp.flare',
        adaptiveIcon: {
            foregroundImage: './assets/icon.png',
            backgroundColor: '#131418'
        }
    },
    web: {
        favicon: './assets/icon.png'
    },

    plugins: [
    'expo-dev-client',
    [
        'expo-splash-screen',
        { backgroundColor: '#131418', image: './assets/icon.png', imageWidth: 200 }
    ],
    'react-native-edge-to-edge'
    ]
};
};

