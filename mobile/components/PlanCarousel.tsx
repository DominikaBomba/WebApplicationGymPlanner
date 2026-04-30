import React from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import PlanCard from './PlanCard';
import { Colors } from '../constants/Colors';
import {Ionicons} from "@expo/vector-icons";

const { width } = Dimensions.get('window');

interface PlanCarouselProps {
    title: string;
    plans: any[];
    onDeletePlan?: (planId: number) => void;
    onDownloadPlan?: (plan: any) => void;
    onAddPress?: () => void;
    emptyMessage?: string;
    headerAction?: React.ReactNode;
}

export default function PlanCarousel({ title, plans, onDeletePlan, onDownloadPlan, onAddPress, emptyMessage, headerAction }: PlanCarouselProps) {
    const renderAddCard = () => {
        if (!onAddPress) return null;

        return (
            <TouchableOpacity style={styles.addCard} onPress={onAddPress}>
                <Ionicons name="add" size={48} color="#ccc" />
                <Text style={styles.addCardText}>Create new plan</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>{title}</Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{plans.length}</Text>
                    </View>
                </View>
                {headerAction && <View>{headerAction}</View>}
            </View>

            <FlatList
                data={plans}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.cardWrapper}>
                        <PlanCard
                            plan={item}
                            onDeletePress={onDeletePlan}
                            onDownloadPress={onDownloadPlan}
                        />
                    </View>
                )}
                ListFooterComponent={renderAddCard}
                ListEmptyComponent={
                    emptyMessage ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{emptyMessage}</Text>
                        </View>
                    ) : null
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark,
    },
    countBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    countText: {
        fontSize: 12,
        color: Colors.dark,
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: 10,
    },
    cardWrapper: {
        width: width * 0.80,
        marginRight: 16,
    },
    emptyContainer: {
        width: width * 0.85,
        minHeight: 100,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        borderStyle: 'dashed',
    },
    emptyText: {
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
    },
    addCard: {
        width: width * 0.80,
        marginRight: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#ccc',
        borderStyle: 'dashed',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 140,
        backgroundColor: 'transparent',
    },
    addCardText: {
        marginTop: 10,
        color: '#ccc',
        fontSize: 16,
        fontWeight: 'bold',
    },
});