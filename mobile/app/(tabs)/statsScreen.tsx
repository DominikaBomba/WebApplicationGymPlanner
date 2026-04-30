import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Dimensions,
    ScrollView,
    ActivityIndicator,
    Platform,
    StyleSheet
} from 'react-native';
import { LineChart, PieChart } from "react-native-chart-kit";
import * as SecureStore from "expo-secure-store";

import { API_URL } from '../../constants/api';
import { Colors } from '../../constants/Colors';

const screenWidth = Dimensions.get("window").width;

export default function StatsScreen() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const token = Platform.OS === 'web'
                ? localStorage.getItem('userToken')
                : await SecureStore.getItemAsync('userToken');

            const response = await fetch(`${API_URL}/api/stats/summary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setStats(data);
        } catch (e) {
            console.error("Error fetching stats:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading || !stats) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 10 }}>Loading statistics...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.mainTitle}>Your Activity</Text>


            <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{stats?.summary?.totalPosts ?? 0}</Text>
                    <Text style={styles.summaryLabel}>Workouts</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{stats?.summary?.totalPlans ?? 0}</Text>
                    <Text style={styles.summaryLabel}>Plans</Text>
                </View>
            </View>


            <Text style={styles.sectionTitle}>Workouts by Weekday</Text>
            <LineChart
                data={{
                    labels: stats?.weeklyChart?.labels || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                    datasets: [{ data: stats?.weeklyChart?.data || [0, 0, 0, 0, 0, 0, 0] }]
                }}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                    backgroundColor: Colors.surface,
                    backgroundGradientFrom: "#1f1f1f",
                    backgroundGradientTo: Colors.dark,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: { r: "6", strokeWidth: "2", stroke: Colors.primary }
                }}
                bezier
                style={styles.chartStyle}
            />

            {/* 5. Top Gyms Section */}
            <Text style={styles.sectionTitle}>Favorite Gyms</Text>
            <View style={styles.gymContainer}>
                {stats?.topGyms && stats.topGyms.length > 0 ? (
                    stats.topGyms.map((gym: any, index: number) => (
                        <View key={index} style={styles.gymRow}>
                            <Text style={styles.gymName}>{gym.name}</Text>
                            <Text style={styles.gymCount}>{gym.count} visits</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No gym data yet</Text>
                )}
            </View>
            <Text style={styles.sectionTitle}>Workout Duration Distribution</Text>
            <View style={styles.pieContainer}>
                <PieChart
                    data={stats?.durationChart || []}
                    width={screenWidth - 40}
                    height={200}
                    chartConfig={{
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor={"count"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    absolute
                />
            </View>
            <Text style={styles.sectionTitle}>Personal Achievements</Text>
            <View style={styles.recordsGrid}>
                <View style={styles.recordCard}>
                    <Text style={styles.recordValue}>{stats?.records?.monthlyCount ?? 0}</Text>
                    <Text style={styles.recordLabel}>Workouts this month</Text>
                </View>


            </View>


            <Text style={styles.sectionTitle}>Your TOP 5 Exercises</Text>
            <View style={styles.exerciseList}>
                {stats?.topExercises && stats.topExercises.length > 0 ? (
                    stats.topExercises.map((ex: any, index: number) => (
                        <View key={index} style={styles.exerciseItem}>
                            <View style={styles.exerciseRank}>
                                <Text style={styles.rankText}>{index + 1}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.exerciseName}>{ex.name}</Text>
                                <Text style={styles.exerciseCount}>{ex._count.name}x in plans</Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={{ textAlign: 'center', color: '#888', padding: 20 }}>No exercise data available</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({

    gymContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    gymRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    gymName: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: Colors.dark,
    },
    gymCount: {
        fontWeight: 'bold',
        color: Colors.primary,
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        padding: 10
    },
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 20
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    mainTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
        color: Colors.dark
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 30,
        marginBottom: 15,
        color: Colors.dark
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15
    },
    summaryCard: {
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 15,
        flex: 1,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4
    },
    chartStyle: {
        marginVertical: 8,
        borderRadius: 16
    },
    pieContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 10,
        borderWidth: 1,
        borderColor: Colors.border
    },
    exerciseList: {
        backgroundColor: Colors.surface,
        borderRadius: 15,
        padding: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 20
    },
    recordsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        gap: 15
    },
    recordCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    recordValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark,
        marginTop: 8
    },
    recordLabel: {
        fontSize: 11,
        color: '#888',
        textAlign: 'center',
        marginTop: 4
    },
    favGymCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.surface,
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 20
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    exerciseRank: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    rankText: {
        fontWeight: 'bold',
        color: '#000'
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.dark
    },
    exerciseCount: {
        color: '#888',
        fontSize: 12,
        marginTop: 2
    }
});