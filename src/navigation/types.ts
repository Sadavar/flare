export type RootStackParamList = {
    Login: undefined;
    Username: undefined;
    Main: {
        screen?: keyof MainTabParamList;
        params?: MainTabParamList[keyof MainTabParamList];
    };
};

export type MainTabParamList = {
    Discover: undefined;
    Post: { image?: string };
    Profile: {
        screen?: keyof ProfileStackParamList;
        params?: ProfileStackParamList[keyof ProfileStackParamList];
    };
};

export type GlobalStackParamList = {
    GlobalFeed: undefined;
    UserProfile: { username: string };
};

export type DiscoverTabParamList = {
    Global: {
        screen?: keyof GlobalStackParamList;
        params?: GlobalStackParamList[keyof GlobalStackParamList];
    };
    Friends: undefined;
    Brands: {
        screen?: keyof BrandsStackParamList;
        params?: BrandsStackParamList[keyof BrandsStackParamList];
    };
};

export type BrandsStackParamList = {
    BrandsList: undefined;
    BrandDetails: { brandId: number; brandName: string };
};

export type ProfileStackParamList = {
    ProfileMain: undefined;
    PostDetails: { postId: string };
    UserProfile: { userId: string; username: string };
}; 