import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/Colors';
import { API_URL } from '../constants/api';

interface PlanCreatorModalProps {
    visible: boolean;
    onClose: () => void;
    // Callback wywoływany po pomyślnym zapisie, zwraca ID nowego planu
    onSaved: (planId: number) => void;
}

export default function PlanCreatorModal({ visible, onClose, onSaved }: PlanCreatorModalProps) {
    const [planTitle, setPlanTitle] = useState('');
    const [exercises, setExercises] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSavingPlan, setIsSavingPlan] = useState(false);

    // Czyszczenie formularza przy otwarciu/zamknięciu
    useEffect(() => {
        if (!visible) {
            setPlanTitle('');
            setExercises([]);
            setQuery('');
            setSuggestions([]);
        }
    }, [visible]);

    // Wyszukiwanie ćwiczeń w API (wger)
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
        } catch (err) {
            console.error("Search API error:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const addExercise = (item?: any) => {
        setExercises([...exercises, { name: item ? item.name : query, reps: "3x12" }]);
        setQuery('');
        setSuggestions([]);
    };

    const handleSavePlan = async () => {
        if (!planTitle.trim() || exercises.length === 0) {
            if (Platform.OS === 'web') window.alert("Please provide a plan name and add at least one exercise.");
            else Alert.alert("Error", "Please provide a plan name and add at least one exercise.");
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
                // Informujemy rodzica, że plan został zapisany i przekazujemy jego nowe ID
                onSaved(data.id);
            } else {
                Alert.alert("Error", "Failed to save the training plan.");
            }
        } catch (e) {
            Alert.alert("Error", "Network error occurred while saving the plan.");
        } finally {
            setIsSavingPlan(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
    <SafeAreaView style={styles.modalContainer}>
    <View style={styles.modalHeader}>
    <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
    <Ionicons name="close" size={28} color={Colors.dark} />
    </TouchableOpacity>
    <Text style={styles.modalTitle}>New Training Plan</Text>
    <TouchableOpacity onPress={handleSavePlan} disabled={isSavingPlan} style={{ padding: 5 }}>
    {isSavingPlan ? (
        <ActivityIndicator size="small" color={Colors.primary} />
    ) : (
        <Text style={styles.saveActionText}>Save</Text>
    )}
    </TouchableOpacity>
    </View>

    <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="always">
    <Text style={styles.label}>Plan Name</Text>
    <TextInput
    style={styles.input}
    value={planTitle}
    onChangeText={setPlanTitle}
    placeholder="e.g. Monday Leg Day"
    />

    <Text style={styles.label}>Add Exercise</Text>
    <View style={styles.searchRow}>
    <TextInput
        style={[styles.input, { flex: 1, marginBottom: 0 }]}
    value={query}
    onChangeText={setQuery}
    placeholder="Search exercises..."
        />
        {query.length > 0 && (
                <TouchableOpacity style={styles.addOwnBtn} onPress={() => addExercise()}>
    <Text style={styles.addOwnBtnText}>+ Own</Text>
        </TouchableOpacity>
)}
    </View>

    {/* Sugestie z API */}
    {isSearching && <ActivityIndicator color={Colors.primary} style={{ margin: 10 }} />}
        {suggestions.map((s) => (
            <TouchableOpacity key={s.id} style={styles.suggestionItem} onPress={() => addExercise(s)}>
            <Text style={styles.suggestionText}>{s.name}</Text>
                <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />

    <Text style={styles.label}>Selected Exercises ({exercises.length})</Text>
        {exercises.length === 0 && (
            <Text style={styles.emptyText}>Search for an exercise above to add it to your plan.</Text>
        )}
        {exercises.map((ex, index) => (
            <View key={index} style={styles.exerciseCard}>
        <View style={{ flex: 1 }}>
            <Text style={styles.exerciseName}>{ex.name}</Text>
                <TextInput
            style={styles.repsInput}
            value={ex.reps}
            placeholder="e.g. 3x12"
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
        }} style={{ padding: 10 }}>
            <Ionicons name="trash-outline" size={22} color={Colors.red} />
        </TouchableOpacity>
        </View>
        ))}
        <View style={{ height: 100 }} />
    </ScrollView>
    </SafeAreaView>
    </Modal>
    );
    }

    const styles = StyleSheet.create({
        modalContainer: { flex: 1, backgroundColor: '#fff' },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
        modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.dark },
        saveActionText: { color: Colors.primary, fontWeight: 'bold', fontSize: 16 },
        modalContent: { padding: 20 },
        label: { fontSize: 16, fontWeight: 'bold', color: Colors.dark, marginBottom: 8, marginTop: 15 },
        input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, padding: 15, borderRadius: 12, fontSize: 16, color: Colors.dark, marginBottom: 5 },
        searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
        addOwnBtn: { backgroundColor: Colors.dark, paddingHorizontal: 15, height: '100%', borderRadius: 12, justifyContent: 'center' },
        addOwnBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
        suggestionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
        suggestionText: { fontSize: 15, color: Colors.dark, flex: 1 },
        exerciseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
        exerciseName: { fontWeight: 'bold', fontSize: 15, color: Colors.dark, marginBottom: 5 },
        repsInput: { color: Colors.primary, borderBottomWidth: 1, borderBottomColor: '#ccc', width: 80, fontSize: 14, paddingVertical: 2 },
        emptyText: { color: '#999', fontStyle: 'italic', marginTop: 5 },
    });