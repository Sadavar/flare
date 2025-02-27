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
    Post: { image?: string, post?: Post };
    Profile: {
        screen?: keyof ProfileStackParamList;
        params?: ProfileStackParamList[keyof ProfileStackParamList];
    };
};

export type GlobalStackParamList = {
    GlobalFeed: undefined;
    UserProfile: {
        username: string;
        initialScreen?: 'PostDetails';
        postData?: Post;
    };
    PostDetails: { post: Post };
};

export type FriendsStackParamList = {
    FriendsFeed: undefined;
    UserProfile: { username: string };
    PostDetails: { post: Post };
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
    PostDetails: { post: Post };
    UserProfile: { username: string };
};

export type BrandsStackParamList = {
    BrandsScreen: undefined;
    BrandDetails: { brandId: number; brandName: string };
    PostDetails: { post: Post };
    UserProfile: { username: string };
};

export type ProfileStackParamList = {
    ProfileMain: undefined;
    PostDetails: { post: Post };
    PostEdit: { post: Post };
    AllPosts: {
        type: 'posts' | 'saved';
    };
    FollowList: undefined;
};

export type PostStackParamList = {
    CreatePost: undefined;
};


export interface Post {
    uuid: string;
    image_url: string;
    description?: string;
    user_uuid?: string;
    username?: string;
    created_at?: string;
    brands?: Brand[];
    styles?: Style[];
    colors?: Color[];
    saved?: boolean;
}

export interface Style {
    id: number;
    name: string;
}

export interface Brand {
    id: number;
    name: string;
    x_coord: number | null;
    y_coord: number | null;
}

export interface Color {
    id: number;
    name: string;
    hex_value: string;
}

