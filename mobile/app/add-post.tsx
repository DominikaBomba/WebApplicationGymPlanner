import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, TextInput, StyleSheet, ScrollView,
    TouchableOpacity, Switch, Platform, Alert, ActivityIndicator, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { Colors } from '../constants/Colors';
import { API_URL } from '../constants/api';
import SearchablePicker from '../components/SearchablePicker';

interface PlanCreatorModalProps {
    visible: boolean;
    onClose: () => void;
    onSaved: (planId: number) => void;
}

export default function AddPostScreen() {
    const [planTitle, setPlanTitle] = useState('');
    const [exercises, setExercises] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSavingPlan, setIsSavingPlan] = useState(false);
    const [loading, setLoading] = useState(false);
    const [gymsData, setGymsData] = useState<any[]>([]);

    const [plansData, setPlansData] = useState<any[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');

    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [selectedGym, setSelectedGym] = useState<any | null>(null);

    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    const [duration, setDuration] = useState<string>('FROM_1_TO_2_HOURS');
    const [maxParticipants, setMaxParticipants] = useState<string>('');
    const [isPublic, setIsPublic] = useState(true);
    const [isCreatorVisible, setIsCreatorVisible] = useState(false);
    const [errors, setErrors] = useState<any>({});

    const fetchGyms = async () => {
        try {
            const token = Platform.OS === 'web'
                ? localStorage.getItem('userToken')
                : await SecureStore.getItemAsync('userToken');

            const headers = { 'Authorization': `Bearer ${token}` };
            const [gymsRes, myPlansRes, friendsPlansRes] = await Promise.all([
                fetch(`${API_URL}/api/gyms`, { headers }),
                fetch(`${API_URL}/api/plans/my-plans`, { headers }),
                fetch(`${API_URL}/api/plans/friends-plans`, { headers })
            ]);
            if (gymsRes.ok) {
                const gyms = await gymsRes.json();
                setGymsData(gyms);
            }
            let allPlans: any[] = [];
            if (myPlansRes.ok) allPlans = [...allPlans, ...(await myPlansRes.json())];
            if (friendsPlansRes.ok) allPlans = [...allPlans, ...(await friendsPlansRes.json())];
            setPlansData(allPlans);
            /*
            if (gymsRes.ok) {setGymsData(await gymsRes.json())}
            else{console.log("here error")}
            const response = await fetch(`${API_URL}/api/gyms`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setGymsData(data);
            }*/
        } catch (error) {
            console.error("Error fetching gyms:", error);
        }
    };

    useEffect(() => {
        fetchGyms();
    }, []);

    const uniqueCities = useMemo(() =>
            Array.from(new Set(gymsData.map(g => g.city))).sort(),
        [gymsData]);

    const availableGyms = useMemo(() =>
            selectedCity ? gymsData.filter(g => g.city === selectedCity) : gymsData,
        [selectedCity, gymsData]);

    const handlePostSubmit = async () => {
        console.log("DEBUG: Wysyłam post. Aktualne selectedPlanId w stanie:", selectedPlanId);
        let newErrors: any = {};

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
            const dateTimeString = `${date}T${time}:00`;
            const finalDate = new Date(dateTimeString).toISOString();

            const parsedMaxParticipants = parseInt(maxParticipants, 10);
            const participantsValue = (isNaN(parsedMaxParticipants) || parsedMaxParticipants <= 0) ? null : parsedMaxParticipants;


            const postData = {
                title,
                gymId: Number(selectedGym.id),
                description,
                date: finalDate,
                trainingDuration: duration,
                additionalInfo: additionalInfo || "",
                isPublic,
                maxParticipants: participantsValue,
                trainingPlanId: selectedPlanId ?? null
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
                if (Platform.OS === 'web') {
                    window.alert("Workout posted successfully!");
                } else {
                    Alert.alert("Success", "Workout posted successfully!");
                }
                router.replace('/home')
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
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length > 2) performSearch(query);
            else setSuggestions([]);
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);
    const performSearch = async (searchTerm: string) => {
        setIsSearching(true);
        try {
            const response = await fetch(`https://wger.de/api/v2/exerciseinfo/?format=json&language=2&limit=50`);
            const data = await response.json();
            const term = searchTerm.toLowerCase();
            const mapped = (data.results || [])
                .map((ex: any) => ({
                    name: ex.translations?.find((t: any) => t.language === 2)?.name ?? ex.name,
                    id: ex.id,
                }))
                .filter((ex: any) => ex.name?.toLowerCase().includes(term))
                .slice(0, 10);
            setSuggestions(mapped);
        } catch (err) { console.log(err); }
        finally { setIsSearching(false); }
    };

    const addExercise = (item?: any) => {
        setExercises([...exercises, { name: item ? item.name : query, reps: "3x12" }]);
        setQuery('');
        setSuggestions([]);
    };
    const handleSavePlan = async () => {
        if (!planTitle.trim() || exercises.length === 0) {
            Alert.alert("Błąd", "Podaj nazwę planu i dodaj ćwiczenia.");
            return;
        }
        setIsSavingPlan(true);
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const response = await fetch(`${API_URL}/api/plans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title: planTitle, exercises })
            });
            const data = await response.json();
            if (response.ok) {
                setSelectedPlanId(data.id);
                console.log("DEBUG: selectedPlanId ustawione na:", data.id);
                fetchGyms();
                setIsCreatorVisible(false);
                setPlanTitle(''); setExercises([]);
            }
        } catch (e) { Alert.alert("Błąd", "Nie udało się zapisać planu."); }
        finally { setIsSavingPlan(false); }
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

                <Text style={styles.label}>Attach Training Plan (Optional)</Text>
                <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <TouchableOpacity
                        style={styles.planActionBtn}
                        onPress={() => setIsCreatorVisible(true)}
                    >
                        <Ionicons name="add-circle" size={20} color={Colors.primary} />
                        <Text style={styles.planActionText}>Create New Plan</Text>
                    </TouchableOpacity>
                </View>
                <SearchablePicker<any>
                    data={plansData}
                    value={plansData.find(p => p.id === selectedPlanId)}
                    onSelect={(plan) => setSelectedPlanId(plan ? plan.id : null)}
                    labelExtractor={(p) => p.author ? `${p.title} (${p.author.nickname})` : p.title}
                    keyExtractor={(p) => p.id.toString()}
                    placeholder="Select a plan from library..."
                />
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
                                {isPublic ? 'Public' : 'Friends only'}
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
                <TouchableOpacity style={styles.cancelBtn} onPress={() => router.replace('/home')}>
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
            <Modal visible={isCreatorVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setIsCreatorVisible(false)}>
                            <Ionicons name="close" size={28} color={Colors.dark} />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>New Training Plan</Text>


                        <TouchableOpacity
                            onPress={handleSavePlan}
                            disabled={isSavingPlan}
                        >
                            {isSavingPlan ? (
                                <ActivityIndicator size="small" color={Colors.primary} />
                            ) : (
                                <Text style={styles.saveActionText}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ padding: 20 }} keyboardShouldPersistTaps="always">
                        <Text style={styles.label}>Plan Name</Text>
                        <TextInput
                            style={styles.input}
                            value={planTitle}
                            onChangeText={setPlanTitle}
                            placeholder="e.g. Monday Leg Day"
                        />

                        <Text style={styles.label}>Add Exercise</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 5 }}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={query}
                                onChangeText={setQuery}
                                placeholder="Search exercises..."
                            />
                            {query.length > 0 && (
                                <TouchableOpacity
                                    style={{ backgroundColor: Colors.dark, padding: 12, borderRadius: 12, justifyContent: 'center' }}
                                    onPress={() => addExercise()}
                                >
                                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>+ Own</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Sugestie z API */}
                        {isSearching && <ActivityIndicator color={Colors.primary} style={{ margin: 10 }} />}
                        {suggestions.map((s) => (
                            <TouchableOpacity
                                key={s.id}
                                style={styles.suggestionItem}
                                onPress={() => addExercise(s)}
                            >
                                <Text>{s.name}</Text>
                                <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
                            </TouchableOpacity>
                        ))}

                        <View style={{ height: 20 }} />

                        <Text style={styles.label}>Selected Exercises ({exercises.length})</Text>
                        {exercises.map((ex, index) => (
                            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, marginBottom: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontWeight: 'bold' }}>{ex.name}</Text>
                                    <TextInput
                                        style={styles.repsInput}
                                        value={ex.reps}
                                        onChangeText={(val) => {
                                            const updated = [...exercises];
                                            updated[index].reps = val;
                                            setExercises(updated);
                                        }}
                                    />
                                </View>

                                <TouchableOpacity onPress={() => {
                                    const updated = exercises.filter((_, i) => i !== index);
                                    setExercises(updated);
                                }}>
                                    <Ionicons name="trash-outline" size={22} color="#ff4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                       <View style={{ height: 100 }} />
                    </ScrollView>
                </SafeAreaView>
            </Modal>
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

    planActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 12,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: Colors.primary
    },
    planActionText: { marginLeft: 8, color: Colors.primary, fontWeight: 'bold' },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    saveActionText: { color: Colors.primary, fontWeight: 'bold', fontSize: 16 },
    repsInput: { color: Colors.primary, borderBottomWidth: 1, borderBottomColor: '#ccc', width: 80 },
    suggestionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
});
