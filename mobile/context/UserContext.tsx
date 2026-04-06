import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/api';

interface UserContextType {
    userData: any;
    setUserData: (data: any) => void;
    loading: boolean;
    fetchUser: () => Promise<void>;
    logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const token = Platform.OS === 'web'
                ? localStorage.getItem('userToken')
                : await SecureStore.getItemAsync('userToken');

            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/api/users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUserData(data.user);
            }
        } catch (error) {
            console.error("Error globally fetching user:", error);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        Platform.OS === 'web'
            ? localStorage.removeItem('userToken')
            : await SecureStore.deleteItemAsync('userToken');
        setUserData(null);
    };

    return (
        <UserContext.Provider value={{ userData, setUserData, loading, fetchUser, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within a UserProvider");
    return context;
};