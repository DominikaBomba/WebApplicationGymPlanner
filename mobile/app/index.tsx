import React, { useState } from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert, Platform} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { Colors } from '../constants/Colors';
import { API_URL } from '../constants/api';
import {useUser} from "@/context/UserContext"; //zmiany w constants/api.ts



export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { fetchUser } = useUser();

    const handleLogin = async () => {
        console.log("Attempting to login with:", email);

        if (!email || !password) {
            Alert.alert("Validation Error", "Please fill in all fields.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login: email, password: password }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Login successful:", data);
                Alert.alert("Success", "Welcome back!");
                Platform.OS === 'web'
                    ?localStorage.setItem('userToken', data.token)
                    :await SecureStore.setItemAsync('userToken', data.token);
                await fetchUser();
                router.replace('/(tabs)/profile');
            } else {
                console.error("Login failed:", data);
                Alert.alert("Error", data.message || "Invalid credentials.");
            }
        } catch (error) {
            console.error("Network error:", error);
            Alert.alert("Network Error", "Could not connect to the server.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.formWrapper}>
                <Text style={styles.title}>Gym planner</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>

                <CustomInput
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <CustomInput
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <CustomButton title="Login" onPress={handleLogin} />

                <TouchableOpacity onPress={() => router.push('/register')} style={styles.linkWrapper}>
                    <Text style={styles.linkText}>Don't have an account? Sign up</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
    },
    formWrapper: {
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: Colors.dark,
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
    },
    linkWrapper: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        color: Colors.dark,
        fontSize: 16,
        textDecorationLine: 'underline',
    }
});