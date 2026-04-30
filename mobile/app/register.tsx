import React, { useState } from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Image} from 'react-native';
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
                if(Platform.OS === 'web') {
                    window.alert("Account created successfully!");
                    router.back();
                }else{
                    Alert.alert("Success", "Account created successfully!", [
                        { text: "OK", onPress: () => router.back() }
                    ]);
                }

            } else {
                console.error("Registration failed:", data);

                let errorMsg = data.error || "Registration failed.";

                if (data.details && Array.isArray(data.details)) {
                    errorMsg = data.details.map((err: any) => `• ${err.message}`).join('\n');
                }

                if (Platform.OS === 'web') {
                    window.alert(`Error:\n${errorMsg}`);
                } else {
                    Alert.alert("Error", errorMsg);
                }
            }
        } catch (error) {
            console.error("Network error:", error);
            Alert.alert("Network Error", "Could not connect to the server.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.formWrapper}>
                <Image source={require('../assets/images/logo.png')} style={styles.logo} resizeMode="contain"/>
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
    },
    logo: {
        width: 300,
        height: 150,
        alignSelf: 'center',
        marginBottom: 10,
    },
});