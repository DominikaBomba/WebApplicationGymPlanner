import React, { useState } from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert, Platform} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { Colors } from '../constants/Colors';
import { API_URL } from '../constants/api'; //zmiany w constants/api.ts


export default function RegisterScreen() {
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async () => {
        console.log("Attempting to register:", email);

        if (!nickname || !email || !password) {
            Alert.alert("Validation Error", "Please fill in all fields.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login: email, nickname: nickname, password: password }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Registration successful:", data);
                if(Platform.OS === 'web') { // przy widoku webowym alerty (Alert.alert) się nie wyświetlają
                    window.alert("Account created successfully!");
                    router.back(); // powrót do logowania
                }else{
                    Alert.alert("Success", "Account created successfully!", [
                        { text: "OK", onPress: () => router.back() } // powrót do logowania
                    ]);
                }

            } else {
                console.error("Registration failed:", data);
                Alert.alert("Error", data.message || "Registration failed.");
            }
        } catch (error) {
            console.error("Network error:", error);
            Alert.alert("Network Error", "Could not connect to the server.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.formWrapper}>
                <Text style={styles.title}>Join Gym planner</Text>
                <Text style={styles.subtitle}>Create your new account</Text>

                <CustomInput
                    placeholder="Username"
                    value={nickname}
                    onChangeText={setNickname}
                    autoCapitalize="none"
                />

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

                <CustomButton title="Sign Up" onPress={handleRegister} />

                <TouchableOpacity onPress={() => router.back()} style={styles.linkWrapper}>
                    <Text style={styles.linkText}>Already have an account? Log in</Text>
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