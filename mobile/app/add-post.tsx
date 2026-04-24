import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, TextInput, StyleSheet, ScrollView,
    TouchableOpacity, Switch, Platform, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { Colors } from '../constants/Colors';
import { API_URL } from '../constants/api';
import SearchablePicker from '../components/SearchablePicker';

export default function AddPostScreen() {
    const [loading, setLoading] = useState(false);
    const [gymsData, setGymsData] = useState<any[]>([]);

    // --- FORM STATES ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');

    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [selectedGym, setSelectedGym] = useState<any | null>(null);

    const [date, setDate] = useState(''); // Format: YYYY-MM-DD
    const [time, setTime] = useState(''); // Format: HH:mm

    const [duration, setDuration] = useState<string>('FROM_1_TO_2_HOURS');
    const [maxParticipants, setMaxParticipants] = useState<string>('');
    const [isPublic, setIsPublic] = useState(true);

    const [errors, setErrors] = useState<any>({});

    // 1. Fetch Gyms (Dla kaskadowego wyboru)
    const fetchGyms = async () => {
        try {
            const token = Platform.OS === 'web'
                ? localStorage.getItem('userToken')
                : await SecureStore.getItemAsync('userToken');

            const response = await fetch(`${API_URL}/api/gyms`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setGymsData(data);
            }
        } catch (error) {
            console.error("Error fetching gyms:", error);
        }
    };

    useEffect(() => {
        fetchGyms();
    }, []);

    // --- HELPERS (Kaskadowe Listy) ---
    const uniqueCities = useMemo(() =>
            Array.from(new Set(gymsData.map(g => g.city))).sort(),
        [gymsData]);

    const availableGyms = useMemo(() =>
            selectedCity ? gymsData.filter(g => g.city === selectedCity) : gymsData,
        [selectedCity, gymsData]);

    // --- SUBMIT LOGIC ---
    const handlePostSubmit = async () => {
        let newErrors: any = {};

        // Walidacja inline
        if (!title || title.length < 3) newErrors.title = "Title must be at least 3 characters long.";
        if (!selectedGym) newErrors.gym = "Please select a location.";
        if (!description) newErrors.description = "Workout plan description is required.";
        if (!date || !time) newErrors.datetime = "Please provide both date and time.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            // Łączenie daty i godziny w jeden obiekt
            const dateTimeString = `${date}T${time}:00`;
            const finalDate = new Date(dateTimeString).toISOString();

            // Parsowanie liczby uczestników (Puste = nielimitowane)
            const parsedMaxParticipants = parseInt(maxParticipants, 10);
            const participantsValue = (isNaN(parsedMaxParticipants) || parsedMaxParticipants <= 0) ? null : parsedMaxParticipants;

            const postData = {
                title,
                gymId: selectedGym.id,
                description,
                date: finalDate,
                trainingDuration: duration,
                additionalInfo: additionalInfo || "",
                isPublic,
                maxParticipants: participantsValue
            };

            const token = Platform.OS === 'web'
                ? localStorage.getItem('userToken')
                : await SecureStore.getItemAsync('userToken');

            const response = await fetch(`${API_URL}/api/posts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                // Sukces - wracamy do poprzedniego ekranu
                if (Platform.OS === 'web') {
                    window.alert("Workout posted successfully!");
                } else {
                    Alert.alert("Success", "Workout posted successfully!");
                }
                router.back();
            } else {
                const err = await response.json();
                Alert.alert("Error", err.error || "Failed to create post.");
            }
        } catch (error) {
            console.error("Submit error:", error);
            Alert.alert("Error", "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                <Text style={styles.label}>Title</Text>
                <TextInput
                    style={[styles.input, errors.title && styles.inputError]}
                    placeholder="e.g. Chest & Triceps"
                    value={title}
                    onChangeText={(text) => { setTitle(text); setErrors({...errors, title: null}); }}
                />
                {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

                <Text style={styles.label}>Choose Location</Text>
                <SearchablePicker<string>
                    data={uniqueCities}
                    value={selectedCity}
                    onSelect={(city) => { setSelectedCity(city); setSelectedGym(null); }}
                    labelExtractor={(item) => item}
                    keyExtractor={(item) => item}
                    placeholder="Filter by city (optional)..."
                />
                <View style={{ height: 10 }} />
                <SearchablePicker<any>
                    data={availableGyms}
                    value={selectedGym}
                    onSelect={setSelectedGym}
                    labelExtractor={(g) => `${g.name} (${g.address})`}
                    keyExtractor={(g) => g.id.toString()}
                    placeholder="Select gym..."
                />
                {errors.gym && <Text style={styles.errorText}>{errors.gym}</Text>}

                {/* to be changed for dedicated date and time inputs */}
                <Text style={styles.label}>When?</Text>
                <View style={styles.row}>
                    <TextInput
                        style={[styles.input, { flex: 2 }]}
                        placeholder="YYYY-MM-DD"
                        value={date}
                        onChangeText={setDate}
                        maxLength={10}
                    />
                    <View style={{ width: 10 }} />
                    <TextInput
                        style={[styles.input, { flex: 1, textAlign: 'center' }]}
                        placeholder="HH:mm"
                        value={time}
                        onChangeText={setTime}
                        maxLength={5}
                    />
                </View>
                {errors.datetime && <Text style={styles.errorText}>{errors.datetime}</Text>}

                <Text style={styles.label}>How long?</Text>
                <View style={styles.choiceRow}>
                    {[
                        { id: 'LESS_THAN_1_HOUR', label: '< 1h' },
                        { id: 'FROM_1_TO_2_HOURS', label: '1-2h' },
                        { id: 'MORE_THAN_2_HOURS', label: '> 2h' }
                    ].map(dur => (
                        <TouchableOpacity
                            key={dur.id}
                            style={[styles.choiceBtn, duration === dur.id && styles.choiceBtnActive]}
                            onPress={() => setDuration(dur.id)}
                        >
                            <Text style={[styles.choiceText, duration === dur.id && styles.choiceTextActive]}>
                                {dur.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Workout plan</Text>
                <TextInput
                    style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                    placeholder="Describe your workout plan..."
                    value={description}
                    onChangeText={(text) => { setDescription(text); setErrors({...errors, description: null}); }}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
                {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

                <Text style={styles.label}>Additional info (optional)</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Any tips or requirements for participants?"
                    value={additionalInfo}
                    onChangeText={setAdditionalInfo}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                />

                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Max participants (0 = no limit)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Unlimited"
                            value={maxParticipants}
                            onChangeText={setMaxParticipants}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={{ width: 20 }} />
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ marginRight: 10, fontWeight: 'bold', color: isPublic ? Colors.primary : '#999' }}>
                                {isPublic ? 'Public' : 'Private'}
                            </Text>
                            <Switch
                                value={isPublic}
                                onValueChange={setIsPublic}
                                trackColor={{ false: '#ccc', true: Colors.primary }}
                                thumbColor="#fff"
                            />
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                    onPress={handlePostSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitBtnText}>Post Workout</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { padding: 20 },
    label: { fontSize: 16, fontWeight: 'bold', color: Colors.dark, marginBottom: 8, marginTop: 15 },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 15,
        borderRadius: 12,
        fontSize: 16,
        color: Colors.dark
    },
    textArea: { minHeight: 100 },
    row: { flexDirection: 'row', alignItems: 'center' },

    choiceRow: { flexDirection: 'row', gap: 10 },
    choiceBtn: {
        flex: 1, paddingVertical: 12, alignItems: 'center',
        borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface
    },
    choiceBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    choiceText: { color: '#666', fontWeight: '500' },
    choiceTextActive: { color: Colors.dark, fontWeight: 'bold' },

    footer: {
        flexDirection: 'row', padding: 20, gap: 15,
        borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface
    },
    cancelBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: Colors.dark },
    cancelBtnText: { color: Colors.dark, fontWeight: 'bold', fontSize: 16 },
    submitBtn: { flex: 2, padding: 15, alignItems: 'center', backgroundColor: Colors.dark, borderRadius: 12 },
    submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    inputError: {
        borderColor: '#ff4444',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
});
