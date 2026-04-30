import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Modal, FlatList, ActivityIndicator, TouchableOpacity, LayoutAnimation, Platform, UIManager, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { fetchPostParticipants, kickParticipant } from '../services/postService';
import { useUser } from '../context/UserContext';
import { router } from "expo-router";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface PostCardProps {
    post: any;
    onToggleJoin?: (postId: number, isParticipating: boolean) => void;
    onDeletePress?: (postId: number) => void;
}

export default function PostCard({ post, onToggleJoin, onDeletePress }: PostCardProps) {
    const { userData } = useUser();
    const [expanded, setExpanded] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [trainingPlan, setTrainingPlan] = useState<any>(null);

    const [participantsModalVisible, setParticipantsModalVisible] = useState(false);
    const [participants, setParticipants] = useState<any[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    const [localCount, setLocalCount] = useState<number>(post._count?.participants || 0);

    useEffect(() => {
        setLocalCount(post._count?.participants || 0);
    }, [post._count?.participants]);

    const postDate = new Date(post.date);
    const formattedDate = postDate.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = postDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

    const durationLabels: Record<string, string> = {
        'LESS_THAN_1_HOUR': '< 1h',
        'FROM_1_TO_2_HOURS': '1-2h',
        'MORE_THAN_2_HOURS': '> 2h'
    };

    const loadFullDetails = async () => {
        const data = await fetchPostParticipants(post.id);
        if (data) {
            setParticipants(data.participants || []);
            setTrainingPlan(data.trainingPlan || null);
        }
    };

    const toggleExpand = async () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        if (!expanded && !trainingPlan) {
            setLoadingDetails(true);
            await loadFullDetails();
            setLoadingDetails(false);
        }
        setExpanded(!expanded);
    };

    const handleDelete = () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Are you sure you want to delete this training session?");
            if (confirmed && onDeletePress) {
                onDeletePress(post.id);
            }
        } else {
            Alert.alert(
                "Delete Post",
                "Are you sure you want to delete this training session?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Yes, delete", style: "destructive", onPress: () => onDeletePress && onDeletePress(post.id) }
                ]
            );
        }
    };

    const handleOpenParticipants = async () => {
        setParticipantsModalVisible(true);
        if (participants.length === 0 && !trainingPlan) {
            setLoadingParticipants(true);
            await loadFullDetails();
            setLoadingParticipants(false);
        }
    };

    const executeKick = async (participant: any) => {
        const success = await kickParticipant(post.id, participant.participantId);
        if (success) {
            setParticipants(prev => prev.filter(p => p.participantId !== participant.participantId));
            setLocalCount(prevCount => prevCount - 1);
        }
    };

    const handleKick = (participant: any) => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`Are you sure you want to remove ${participant.user.nickname} from this training?`);
            if (confirmed) {
                executeKick(participant);
            }
        } else {
            Alert.alert(
                "Remove Participant",
                `Are you sure you want to remove ${participant.user.nickname} from this training?`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Remove", style: "destructive", onPress: () => executeKick(participant) }
                ]
            );
        }
    };

    const handleProfileNavigation = () => {
        if (!post.user?.nickname) return;

        if (isOwnPost) {
            router.push('/(tabs)/profile');
        } else {
            router.push({
                pathname: "/user/[nickname]",
                params: { nickname: post.user.nickname }
            });
        }
    };

    const isParticipating = post.participants && post.participants.length > 0;
    const isOwnPost = post.userId === userData?.id;

    const isFull = post.maxParticipants !== null && localCount >= post.maxParticipants;

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.userInfo} onPress={handleProfileNavigation}>
                    <Image source={{ uri: post.user?.profilePicture || require("../assets/images/no_avatar.png") }} style={styles.avatar} />
                    <View>
                        <Text style={styles.nickname}>{post.user?.nickname}</Text>
                        <Text style={styles.gymInfo}>{post.gym?.name}, {post.gym?.city}</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.levelContainer}>
                    {isOwnPost && (
                        <TouchableOpacity onPress={handleDelete} style={styles.deleteIcon}>
                            <Ionicons name="trash-outline" size={20} color={Colors.red} />
                        </TouchableOpacity>
                    )}
                    <div style={styles.levelBadge}>
                        <Text style={styles.levelText}>{post.user?.level}</Text>
                    </div>
                </View>
            </View>

            <View style={styles.mainContent}>
                <Text style={styles.title}>{post.title}</Text>
                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}><Ionicons name="calendar-outline" size={16} color={Colors.primary} /><Text style={styles.detailText}>{formattedDate}</Text></View>
                    <View style={styles.detailItem}><Ionicons name="time-outline" size={16} color={Colors.primary} /><Text style={styles.detailText}>{formattedTime}</Text></View>
                    <View style={styles.detailItem}><Ionicons name="hourglass-outline" size={16} color={Colors.primary} /><Text style={styles.detailText}>{durationLabels[post.trainingDuration] || '1-2h'}</Text></View>
                </View>

                <Text style={styles.description} numberOfLines={expanded ? undefined : 3}>{post.description}</Text>

                <TouchableOpacity onPress={toggleExpand} style={styles.seeMoreBtn}>
                    <Text style={styles.seeMoreText}>{expanded ? 'Show less' : 'See training plan & more...'}</Text>
                    <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color={Colors.primary} />
                </TouchableOpacity>

                {expanded && (
                    <View style={styles.expandedSection}>
                        {loadingDetails ? (
                            <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 10 }} />
                        ) : (
                            <>
                                {trainingPlan ? (
                                    <View style={styles.planBox}>
                                        <Text style={styles.planTitle}>
                                            <Ionicons name="fitness" size={16} color={Colors.primary} /> Training Plan: {trainingPlan.name}
                                        </Text>
                                        {trainingPlan.exercises?.map((ex: any, index: number) => (
                                            <View key={index} style={styles.exerciseRow}>
                                                <Text style={styles.exerciseName}>{ex.name}</Text>
                                                <Text style={styles.exerciseDetails}>{ex.sets} sets x {ex.reps} reps</Text>
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <Text style={styles.noPlanText}>No specific training plan attached.</Text>
                                )}

                                {post.additionalInfo && (
                                    <View style={styles.additionalInfoBox}>
                                        <Text style={styles.additionalInfoTitle}>Additional Info:</Text>
                                        <Text style={styles.additionalInfoText}>{post.additionalInfo}</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.participantsBox} onPress={handleOpenParticipants}>
                    <Ionicons name="people" size={18} color={(isParticipating || isOwnPost) ? Colors.primary : "#999"} />
                    <Text style={[styles.participantsText, (isParticipating || isOwnPost) && styles.participatingText]}>
                        {localCount} / {post.maxParticipants || '∞'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.actionArea}>
                    {isOwnPost ? (
                        <View style={styles.ownPostContainer}>
                            <View style={[styles.statusBadge, { marginRight: 8 }]}>
                                <Ionicons name={post.isPublic ? "earth-outline" : "people-outline"} size={14} color={post.isPublic ? Colors.primary : "#999"} />
                                <Text style={[styles.statusText, { color: post.isPublic ? Colors.primary : "#999" }]}>{post.isPublic ? 'Public' : 'Friends only'}</Text>
                            </View>
                            <View style={styles.ownPostBadge}>
                                <Ionicons name="star" size={14} color={Colors.primary} />
                                <Text style={styles.ownPostText}>Your Post</Text>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.joinButton,
                                isParticipating && styles.leaveButton,
                                (!isParticipating && isFull) && styles.fullButton // Nowy styl gdy pełny
                            ]}
                            onPress={() => onToggleJoin && onToggleJoin(post.id, isParticipating)}
                            disabled={!isParticipating && isFull}
                        >
                            <Text style={[
                                styles.joinButtonText,
                                isParticipating && styles.leaveButtonText,
                                (!isParticipating && isFull) && styles.fullButtonText
                            ]}>
                                {isParticipating ? 'Leave' : (isFull ? 'Full' : 'Join Training')}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <Modal
                visible={participantsModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setParticipantsModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Participants</Text>
                        <TouchableOpacity onPress={() => setParticipantsModalVisible(false)} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={Colors.dark} />
                        </TouchableOpacity>
                    </View>

                    {loadingParticipants ? (
                        <ActivityIndicator color={Colors.primary} style={{ marginTop: 50 }} />
                    ) : (
                        <FlatList
                            data={participants}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={{ padding: 20 }}
                            renderItem={({ item }) => (
                                <View style={styles.friendCard}>
                                    <TouchableOpacity
                                        style={styles.friendInfoWrapper}
                                        onPress={() => {
                                            setParticipantsModalVisible(false);
                                            router.push({ pathname: "/user/[nickname]", params: { nickname: item.user.nickname } });
                                        }}
                                    >
                                        <Image source={{ uri: item.user.profilePicture || require("../assets/images/no_avatar.png")}} style={styles.friendAvatar} />
                                        <View style={styles.friendInfo}>
                                            <Text style={styles.friendName}>{item.user.nickname}</Text>
                                            <Text style={styles.friendLevel}>{item.user.level || 'BEGINNER'}</Text>
                                        </View>
                                    </TouchableOpacity>

                                    {isOwnPost && item.participantId !== userData?.id ? (
                                        <TouchableOpacity onPress={() => handleKick(item)} style={styles.kickBtn}>
                                            <Ionicons name="trash-outline" size={20} color={Colors.red} />
                                        </TouchableOpacity>
                                    ) : (
                                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                                    )}
                                </View>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>No one has joined yet.</Text>
                            }
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </View>
    );
}
const styles = StyleSheet.create({
    card: { backgroundColor: Colors.surface, borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: Colors.primary },
    nickname: { fontSize: 16, fontWeight: 'bold', color: Colors.dark },
    gymInfo: { fontSize: 12, color: '#888' },

    levelContainer: { flexDirection: 'row', alignItems: 'center' },
    deleteIcon: { marginRight: 10, padding: 4 },
    levelBadge: { backgroundColor: '#8C7A3C', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    levelText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginHorizontal: 4 },

    mainContent: { marginBottom: 12 },
    title: { fontSize: 18, fontWeight: 'bold', color: Colors.dark, marginBottom: 8 },
    detailsRow: { flexDirection: 'row', marginBottom: 10, gap: 15 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    detailText: { fontSize: 13, color: '#666' },
    description: { fontSize: 14, color: '#444', lineHeight: 20 },
    seeMoreBtn: { marginTop: 5 },
    seeMoreText: { color: Colors.primary, fontWeight: 'bold', fontSize: 13 },
    additionalInfoBox: { marginTop: 10, padding: 10, backgroundColor: Colors.background, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: Colors.primary },
    additionalInfoTitle: { fontSize: 12, fontWeight: 'bold', color: Colors.dark, marginBottom: 2 },
    additionalInfoText: { fontSize: 13, color: '#666', fontStyle: 'italic' },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 },
    participantsBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    participantsText: { fontSize: 14, color: '#666', fontWeight: '600' },
    participatingText: { color: Colors.primary },
    actionArea: { flexDirection: 'row', alignItems: 'center' },
    ownPostContainer: { flexDirection: 'row', alignItems: 'center' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, gap: 4, borderWidth: 1, borderColor: '#EEE' },
    statusText: { fontSize: 12, fontWeight: '600' },
    ownPostBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9E6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 5, borderWidth: 1, borderColor: '#FFE082' },
    ownPostText: { color: Colors.primary, fontWeight: 'bold', fontSize: 13 },
    joinButton: { backgroundColor: Colors.dark, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 },
    joinButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    leaveButton: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: Colors.red },
    leaveButtonText: { color: Colors.red },

    modalContainer: { flex: 1, backgroundColor: Colors.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    closeButton: { paddingHorizontal: 8 },
    emptyText: { textAlign: 'center', marginTop: 40, color: '#999' },
    kickBtn: { padding: 10 },

    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 15,
        borderRadius: 16,
        marginBottom: 10,
    },
    friendInfoWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    friendAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.dark,
    },
    friendLevel: {
        fontSize: 12,
        color: '#8C7A3C',
        marginTop: 2,
        fontWeight: 'bold',
    },
    expandedSection: {
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
    },
    planBox: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    planTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.dark,
        marginBottom: 8,
    },
    exerciseRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    exerciseName: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
    },
    exerciseDetails: {
        fontSize: 12,
        color: '#666',
    },
    noPlanText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    fullButton: { backgroundColor: '#E0E0E0', borderWidth: 0 },
    fullButtonText: { color: '#999' },

});