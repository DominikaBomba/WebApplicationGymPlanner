import { createContext, useContext, useState, useEffect, type ReactNode, useMemo, useCallback } from "react";
import type {UserData} from "./types/UserData.ts";



interface AuthContextType {
    user: UserData | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        setUser(null);
    }, []);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/api/users/me", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                logout();
            }
        } catch (error) {
            console.error("Auth error:", error);
            // Opcjonalnie: logout() przy błędzie sieci?
        } finally {
            setLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // Zapobiega niepotrzebnym renderom dzieci
    const value = useMemo(() => ({
        user,
        loading,
        refreshUser: fetchUser,
        logout
    }), [user, loading, fetchUser, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};