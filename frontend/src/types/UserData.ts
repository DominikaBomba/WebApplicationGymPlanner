export interface UserData {
    id: number;
    login: string;
    nickname: string;
    password: string; // Uwaga: hasła nie powinno być na froncie, ale skoro masz je w typie...
    profilePicture: string | null;
    level: string;
    description: string | null;

    // DODAJ TE LINIE:
    friends?: any[];
    friendsAdded?: any[];
    friendsOf?: any[];
}