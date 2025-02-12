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
    PostDetails: { postId: string };
};

export type FriendsStackParamList = {
    FriendsFeed: undefined;
    UserProfile: { username: string };
    PostDetails: { postId: string };
};

export type DiscoverTabParamList = {
    Global: {
        screen?: keyof GlobalStackParamList;
        params?: GlobalStackParamList[keyof GlobalStackParamList];
    };
    Friends: {
        screen?: keyof FriendsStackParamList;
        params?: FriendsStackParamList[keyof FriendsStackParamList];
    };
    Brands: {
        screen?: keyof BrandsStackParamList;
        params?: BrandsStackParamList[keyof BrandsStackParamList];
    };
    UserProfile: { username: string };
};

export type BrandsStackParamList = {
    BrandsScreen: undefined;
    BrandDetails: { brandId: number; brandName: string };
    PostDetails: { postId: string };
};

export type ProfileStackParamList = {
    ProfileMain: undefined;
    PostDetails: { postId: string };
};

export type PostStackParamList = {
    CreatePost: undefined;
};

export interface Post {
    uuid: string;
    image_url: string;
    description: string;
    user: {
        username: string;
    };
    brands: Array<{
        id: number;
        name: string;
    }>;
}

