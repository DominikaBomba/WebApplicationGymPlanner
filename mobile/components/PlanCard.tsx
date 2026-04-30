import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useUser } from '../context/UserContext';
import { isPlanOffline, savePlanOffline, removePlanOffline } from '../services/localDatabase';

interface PlanCardProps {
    plan: any;
    onDeletePress?: (planId: number) => void;
    onOfflineRemoveCallback?: (planId: number) => void;
}

export default function PlanCard({ plan, onDeletePress, onOfflineRemoveCallback }: PlanCardProps) {
    const { userData } = useUser();
    const [expanded, setExpanded] = useState(false);

    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const checkOfflineStatus = async () => {
            const status = await isPlanOffline(plan.id);
            setIsSaved(status);
        };
        checkOfflineStatus();
    }, [plan.id]);

    const isOwnPlan = plan.authorId === userData?.id;

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    const handleDelete = () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Are you sure you want to completely delete the plan "${plan.title}"?`);
            if (confirmed && onDeletePress) onDeletePress(plan.id);
        } else {
            Alert.alert(
                "Delete Plan",
                `Are you sure you want to completely delete the plan "${plan.title}"?`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => onDeletePress && onDeletePress(plan.id) }
                ]
            );
        }
    };

    const handleToggleOffline = () => {
        if (isSaved) {
            if (Platform.OS === 'web') {
                const confirmed = window.confirm(`Remove "${plan.title}" from offline downloads?`);
                if (confirmed) executeRemoveOffline();
            } else {
                Alert.alert(
                    "Remove from Downloads",
                    `Do you want to remove "${plan.title}" from your device?`,
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Remove", style: "destructive", onPress: executeRemoveOffline }
                    ]
                );
            }
        } else {
            executeSaveOffline();
        }
    };

    const executeSaveOffline = async () => {
        const success = await savePlanOffline(plan);
        if (success) {
            setIsSaved(true);
            if (Platform.OS !== 'web') Alert.alert("Saved", "Plan is now available offline.");
            else window.alert("Plan is now available offline.");
        }
    };

    const executeRemoveOffline = async () => {
        const success = await removePlanOffline(plan.id);
        if (success) {
            setIsSaved(false);
            if (onOfflineRemoveCallback) {
                onOfflineRemoveCallback(plan.id);
            }
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Ionicons name="fitness" size={24} color={Colors.primary} />
                    <Text style={styles.title} numberOfLines={1}>{plan.title}</Text>
                </View>

                <View style={styles.actionsContainer}>
                    <TouchableOpacity onPress={handleToggleOffline} style={styles.actionBtn}>
                        <Ionicons
                            name={isSaved ? "cloud-done" : "cloud-download-outline"}
                            size={24}
                            color={isSaved ? "#4CAF50" : Colors.primary}
                        />
                    </TouchableOpacity>

                    {isOwnPlan && onDeletePress && (
                        <TouchableOpacity onPress={handleDelete} style={[styles.actionBtn, { marginLeft: 10 }]}>
                            <Ionicons name="trash-outline" size={22} color={Colors.red} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.infoRow}>
                <Text style={styles.infoText}>{plan.exercises?.length || 0} exercises</Text>
                {plan.author && !isOwnPlan && (
                    <Text style={styles.authorText}>by {plan.author.nickname}</Text>
                )}
            </View>

            <TouchableOpacity style={styles.toggleBtn} onPress={toggleExpand}>
                <Text style={styles.toggleBtnText}>{expanded ? "Hide exercises" : "Show exercises"}</Text>
                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={Colors.primary} />
            </TouchableOpacity>

            {expanded && (
                <View style={styles.exerciseList}>
                    {plan.exercises?.map((ex: any, idx: number) => (
                        <View key={idx} style={styles.exerciseItem}>
                            <Text style={styles.exerciseName}>{ex.name}</Text>
                            <Text style={styles.exerciseReps}>{ex.reps}</Text>
                        </View>
                    ))}
                    {(!plan.exercises || plan.exercises.length === 0) && (
                        <Text style={styles.emptyText}>No exercises found.</Text>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: { backgroundColor: Colors.surface, borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3},
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    titleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
    title: { fontSize: 18, fontWeight: 'bold', color: Colors.dark, marginLeft: 8, flex: 1 },
    actionsContainer: { flexDirection: 'row', alignItems: 'center' },
    actionBtn: { padding: 4 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    infoText: { fontSize: 13, color: '#666', fontWeight: '500' },
    authorText: { fontSize: 13, color: Colors.primary, fontStyle: 'italic' },
    toggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9', padding: 8, borderRadius: 8 },
    toggleBtnText: { color: Colors.primary, fontWeight: 'bold', marginRight: 4, fontSize: 13 },
    exerciseList: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
    exerciseItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    exerciseName: { fontSize: 14, color: Colors.dark, flex: 2 },
    exerciseReps: { fontSize: 14, color: '#666', flex: 1, textAlign: 'right' },
    emptyText: { color: '#999', fontStyle: 'italic', textAlign: 'center', marginTop: 10 }
});