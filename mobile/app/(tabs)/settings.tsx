import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
    Alert, ActivityIndicator, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

import { Colors } from '../../constants/Colors';
import { API_URL } from '../../constants/api';
import { useUser } from '../../context/UserContext';

export default function SettingsScreen() {
    // Pobieramy fetchUser z Twojego kontekstu
    const { userData, fetchUser } = useUser();

    const [level, setLevel] = useState(userData?.level || "BEGINNER");
    const [description, setDescription] = useState(userData?.description || "");
    const [profilePicture, setProfilePicture] = useState(userData?.profilePicture || "");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (userData) {
            setLevel(userData.level || "BEGINNER");
            setDescription(userData.description || "");
            setProfilePicture(userData.profilePicture || "");
        }
    }, [userData]);

    const handleUpdate = async () => {
        setSaving(true);
        try {
            const token = Platform.OS === 'web'
                ? localStorage.getItem('userToken')
                : await SecureStore.getItemAsync('userToken');

            const response = await fetch(`${API_URL}/api/users/update`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    level,
                    description,
                    profilePicture
                })
            });

            if (response.ok) {
                // Wywołujemy fetchUser(), który pobierze świeże dane z /me
                // i zaktualizuje globalny stan aplikacji
                await fetchUser();

                Alert.alert("Sukces", "Profil został zaktualizowany!");
                router.back();
            } else {
                const errorData = await response.json();
                Alert.alert("Błąd", errorData.error || "Nie udało się zapisać zmian.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Błąd", "Problem z połączeniem z serwerem.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.dark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nickname (Read-only)</Text>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={userData?.nickname}
                            editable={false}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Profile Picture URL</Text>
                        <TextInput
                            style={styles.input}
                            value={profilePicture}
                            onChangeText={setProfilePicture}
                            placeholder="https://example.com/photo.jpg"
                        />
                    </View>

                    <Text style={styles.label}>Training Level</Text>
                    <View style={styles.levelRow}>
                        {['BEGINNER', 'MID', 'ADVANCED', 'PRO'].map((lvl) => (
                            <TouchableOpacity
                                key={lvl}
                                style={[styles.levelBtn, level === lvl && styles.levelBtnActive]}
                                onPress={() => setLevel(lvl)}
                            >
                                <Text style={[styles.levelBtnText, level === lvl && styles.levelBtnTextActive]}>
                                    {lvl}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>About Me</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                    onPress={handleUpdate}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    scrollContent: { padding: 20 },
    form: { gap: 20 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: 'bold', color: Colors.dark },
    input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 15, fontSize: 16 },
    disabledInput: { color: '#888', backgroundColor: '#f5f5f5' },
    textArea: { minHeight: 100, paddingTop: 15 },
    levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    levelBtn: { flex: 1, minWidth: '45%', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.surface },
    levelBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    levelBtnText: { color: '#666', fontWeight: '600' },
    levelBtnTextActive: { color: Colors.dark },
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: Colors.border },
    saveBtn: { backgroundColor: Colors.dark, padding: 18, borderRadius: 15, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});