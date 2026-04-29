import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/api';

export const toggleJoinTraining = async (postId: number, isParticipating: boolean): Promise<boolean> => {
    try {
        const token = Platform.OS === 'web'
            ? localStorage.getItem('userToken')
            : await SecureStore.getItemAsync('userToken');

        const endpoint = isParticipating ? '/api/posts/leave_post' : '/api/posts/join_post';
        const method = isParticipating ? 'DELETE' : 'POST';

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ postId })
        });

        if (response.ok) {
            return true;
        } else {
            const errorData = await response.json();
            console.error("Failed to toggle join:", errorData);
            Alert.alert("Error", errorData.error || "Failed to update training status.");
            return false;
        }
    } catch (error) {
        console.error("Error during join/leave API call:", error);
        Alert.alert("Error", "Network error occurred.");
        return false;
    }
};