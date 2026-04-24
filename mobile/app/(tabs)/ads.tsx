import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    TouchableOpacity, RefreshControl, Modal, TextInput, ScrollView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../../constants/Colors';
import { API_URL } from '../../constants/api';
import { useUser } from '../../context/UserContext';
import PostCard from '../../components/PostCard';
import SearchablePicker from '../../components/SearchablePicker';
import FloatingActionButton from "@/components/FloatingActionButton";

export default function AdsScreen() {
    const { userData } = useUser();
    const [posts, setPosts] = useState<any[]>([]);
    const [gymsData, setGymsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);

    // --- FILTER STATES ---
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [selectedGym, setSelectedGym] = useState<any | null>(null);
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [selectedDurations, setSelectedDurations] = useState<string[]>([]);
    const [startDate, setStartDate] = useState(''); // YYYY-MM-DD
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState(''); // HH:mm
    const [endTime, setEndTime] = useState('');
    const [selectedSort, setSelectedSort] = useState('soonest'); // 'soonest' or 'latest'

    // 1. Fetch Gyms
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

    // 2. Fetch Posts with Filters
    const fetchPosts = useCallback(async () => {
        try {
            const queryParams = new URLSearchParams();
            if (selectedCity) queryParams.append('city', selectedCity);
            if (selectedGym) queryParams.append('gymId', selectedGym.id.toString());
            if (selectedLevels.length > 0) queryParams.append('levels', selectedLevels.join(','));
            if (selectedDurations.length > 0) queryParams.append('durations', selectedDurations.join(','));
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);
            if (startTime) queryParams.append('startTime', startTime);
            if (endTime) queryParams.append('endTime', endTime);
            queryParams.append('sort', selectedSort);

            const token = Platform.OS === 'web'
                ? localStorage.getItem('userToken')
                : await SecureStore.getItemAsync('userToken');

            const response = await fetch(`${API_URL}/api/posts/all?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setPosts(data);
            }
        } catch (error) {
            console.error("Error fetching ads:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCity, selectedGym, selectedLevels, selectedDurations, startDate, endDate, startTime, endTime, selectedSort]);

    const handleToggleJoin = async (postId: number, isParticipating: boolean) => {
        try {
            const token = Platform.OS === 'web'
                ? localStorage.getItem('userToken')
                : await SecureStore.getItemAsync('userToken');

            // Wybieramy odpowiedni endpoint i metodę w zależności od stanu
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
                // Optimistic UI Update: Natychmiastowa aktualizacja lokalnego stanu
                setPosts(prevPosts => prevPosts.map(post => {
                    if (post.id === postId) {
                        // Obliczamy nową wartość _count
                        const currentCount = post._count?.participants || 0;
                        const newCount = isParticipating ? currentCount - 1 : currentCount + 1;

                        return {
                            ...post,
                            // Dodajemy lub usuwamy atrapę z tablicy participants
                            participants: isParticipating ? [] : [{ participantId: userData.id }],
                            _count: { participants: newCount }
                        };
                    }
                    return post;
                }));
            } else {
                const errorData = await response.json();
                console.error("Failed to toggle join:", errorData);
            }
        } catch (error) {
            console.error("Error during join/leave API call:", error);
        }
    };

    useEffect(() => {
        fetchGyms();
        fetchPosts();
    }, [fetchPosts]);

    // --- HELPERS ---
    const uniqueCities = useMemo(() =>
            Array.from(new Set(gymsData.map(g => g.city))).sort(),
        [gymsData]);

    const availableGyms = useMemo(() =>
            selectedCity ? gymsData.filter(g => g.city === selectedCity) : gymsData,
        [selectedCity, gymsData]);

    const toggleMultiSelect = (list: string[], setList: (l: string[]) => void, value: string) => {
        if (list.includes(value)) {
            setList(list.filter(item => item !== value));
        } else {
            setList([...list, value]);
        }
    };

    const clearFilters = () => {
        setSelectedCity(null); setSelectedGym(null);
        setSelectedLevels([]); setSelectedDurations([]);
        setStartDate(''); setEndDate('');
        setStartTime(''); setEndTime('');
    };

    const activeFiltersCount = (selectedCity ? 1 : 0) + selectedLevels.length + selectedDurations.length + (startDate ? 1 : 0);

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            {/* FILTER & SORT BAR */}
            <View style={styles.topBar}>
                {/* Left: Filter Button */}
                <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModalVisible(true)}>
                    <Ionicons name="filter" size={18} color={Colors.dark} />
                    <Text style={styles.filterBtnText}>Filters</Text>
                    {activeFiltersCount > 0 && (
                        <View style={styles.badge}><Text style={styles.badgeText}>{activeFiltersCount}</Text></View>
                    )}
                </TouchableOpacity>

                {/* Right: Sort Toggle */}
                <View style={styles.sortContainer}>
                    <Text style={styles.sortLabel}>Sort by:</Text>
                    <TouchableOpacity
                        style={styles.sortBtn}
                        onPress={() => setSelectedSort(selectedSort === 'soonest' ? 'latest' : 'soonest')}
                    >
                        <Text style={styles.sortBtnText}>{selectedSort === 'soonest' ? 'Soonest' : 'Latest'}</Text>
                        <Ionicons name="swap-vertical" size={16} color={Colors.dark} />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={posts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <PostCard post={item} onToggleJoin={handleToggleJoin}/>}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(); }} tintColor={Colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search-outline" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>No training sessions found.</Text>
                    </View>
                }
            />

            <FloatingActionButton onPress={() => router.push('/add-post')} />

            {/* FILTER MODAL */}
            <Modal visible={filterModalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Advanced Filters</Text>
                        <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                            <Ionicons name="close" size={26} color={Colors.dark} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        {/* LOCATION */}
                        <Text style={styles.label}>Location</Text>
                        <SearchablePicker<string>
                            data={uniqueCities}
                            value={selectedCity}
                            onSelect={(city) => { setSelectedCity(city); setSelectedGym(null); }}
                            labelExtractor={(item) => item}
                            keyExtractor={(item) => item}
                            placeholder="Choose city..."
                            searchPlaceholder="Search city..."
                        />
                        <View style={{ height: 10 }} />
                        <SearchablePicker<any>
                            data={availableGyms}
                            value={selectedGym}
                            onSelect={setSelectedGym}
                            labelExtractor={(g) => `${g.name} (${g.address})`}
                            keyExtractor={(g) => g.id.toString()}
                            placeholder="Choose gym..."
                            searchPlaceholder="Search gym..."
                        />

                        {/* LEVELS (Multi-select) */}
                        <Text style={styles.label}>Training Level</Text>
                        <View style={styles.rowChoices}>
                            {['BEGINNER', 'MID', 'ADVANCED', 'PRO'].map(lvl => (
                                <TouchableOpacity
                                    key={lvl}
                                    style={[styles.choiceBtn, selectedLevels.includes(lvl) && styles.choiceBtnActive]}
                                    onPress={() => toggleMultiSelect(selectedLevels, setSelectedLevels, lvl)}
                                >
                                    <Text style={[styles.choiceText, selectedLevels.includes(lvl) && styles.choiceTextActive]}>{lvl}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* DURATION (Multi-select) */}
                        <Text style={styles.label}>Training Duration</Text>
                        <View style={styles.rowChoices}>
                            {[
                                {id: 'LESS_THAN_1_HOUR', label: '< 1h'},
                                {id: 'FROM_1_TO_2_HOURS', label: '1-2h'},
                                {id: 'MORE_THAN_2_HOURS', label: '> 2h'}
                            ].map(dur => (
                                <TouchableOpacity
                                    key={dur.id}
                                    style={[styles.choiceBtn, selectedDurations.includes(dur.id) && styles.choiceBtnActive]}
                                    onPress={() => toggleMultiSelect(selectedDurations, setSelectedDurations, dur.id)}
                                >
                                    <Text style={[styles.choiceText, selectedDurations.includes(dur.id) && styles.choiceTextActive]}>{dur.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* DATE RANGE */}
                        <Text style={styles.label}>Date Range (From - To)</Text>
                        <View style={styles.rangeRow}>
                            <TextInput
                                style={styles.rangeInput}
                                placeholder="2026-04-01"
                                value={startDate}
                                onChangeText={setStartDate}
                            />
                            <Text style={styles.rangeSep}>to</Text>
                            <TextInput
                                style={styles.rangeInput}
                                placeholder="2026-04-30"
                                value={endDate}
                                onChangeText={setEndDate}
                            />
                        </View>

                        {/* TIME RANGE */}
                        <Text style={styles.label}>Time Range (Between)</Text>
                        <View style={styles.rangeRow}>
                            <TextInput
                                style={styles.rangeInput}
                                placeholder="18:00"
                                value={startTime}
                                onChangeText={setStartTime}
                                maxLength={5}
                            />
                            <Text style={styles.rangeSep}>and</Text>
                            <TextInput
                                style={styles.rangeInput}
                                placeholder="21:00"
                                value={endTime}
                                onChangeText={setEndTime}
                                maxLength={5}
                            />
                        </View>

                        <View style={{ height: 50 }} />
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                            <Text style={styles.clearBtnText}>Clear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.applyBtn} onPress={() => { setFilterModalVisible(false); fetchPosts(); }}>
                            <Text style={styles.applyBtnText}>Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8
    },
    filterBtnText: { fontWeight: 'bold', color: Colors.dark },
    badge: {
        backgroundColor: Colors.dark,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center'
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    sortContainer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    sortLabel: { fontSize: 12, color: '#999' },
    sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10 },
    sortBtnText: { fontWeight: 'bold', color: Colors.dark },

    listContent: { padding: 16, paddingBottom: 80 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { textAlign: 'center', marginTop: 10, color: '#999', fontSize: 16 },

    modalContainer: { flex: 1, backgroundColor: Colors.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalContent: { padding: 20 },
    label: { fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    rowChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    choiceBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
    choiceBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    choiceText: { color: '#666' },
    choiceTextActive: { color: Colors.dark, fontWeight: 'bold' },

    rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    rangeInput: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, padding: 12, borderRadius: 10, textAlign: 'center' },
    rangeSep: { color: '#999', fontSize: 12 },

    modalFooter: { flexDirection: 'row', padding: 20, gap: 15, borderTopWidth: 1, borderTopColor: Colors.border },
    clearBtn: { flex: 1, padding: 15, alignItems: 'center', borderRadius: 12, borderWidth: 1 },
    clearBtnText: { fontWeight: 'bold' },
    applyBtn: { flex: 2, padding: 15, alignItems: 'center', backgroundColor: Colors.dark, borderRadius: 12 },
    applyBtnText: { color: '#fff', fontWeight: 'bold' },
});
