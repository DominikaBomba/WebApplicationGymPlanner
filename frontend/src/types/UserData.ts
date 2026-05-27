export interface UserData {
    id: number;
    login: string;
    nickname: string;
    password: string;
    profilePicture: string | null;
    level: string;
    description: string | null;

    friends?: any[];
    friendsAdded?: any[];
    friendsOf?: any[];
}