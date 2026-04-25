import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useUser } from '../context/UserContext';


if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface PostCardProps {
    post: any;
    onToggleJoin?: (postId: number, isParticipating: boolean) => void;
}

export default function PostCard({ post, onToggleJoin }: PostCardProps) {
    const { userData } = useUser();
    const [expanded, setExpanded] = useState(false);

    const postDate = new Date(post.date);
    const formattedDate = postDate.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = postDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

    const durationLabels: Record<string, string> = {
        'LESS_THAN_1_HOUR': '< 1h',
        'FROM_1_TO_2_HOURS': '1-2h',
        'MORE_THAN_2_HOURS': '> 2h'
    };

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    const isParticipating = post.participants && post.participants.length > 0;
    const participantsCount = post._count?.participants || 0;

    const isOwnPost = post.userId === userData?.id;

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Image source={{ uri: post.user?.profilePicture || 'https://i.pravatar.cc/150?img=11' }} style={styles.avatar} />
                    <View>
                        <Text style={styles.nickname}>{post.user?.nickname}</Text>
                        <Text style={styles.gymInfo}>{post.gym?.name}, {post.gym?.city}</Text>
                    </View>
                </View>
                <View style={styles.levelBadge}><Text style={styles.levelText}>{post.user?.level}</Text></View>
            </View>

            <View style={styles.mainContent}>
                <Text style={styles.title}>{post.title}</Text>
                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}><Ionicons name="calendar-outline" size={16} color={Colors.primary} /><Text style={styles.detailText}>{formattedDate}</Text></View>
                    <View style={styles.detailItem}><Ionicons name="time-outline" size={16} color={Colors.primary} /><Text style={styles.detailText}>{formattedTime}</Text></View>
                    <View style={styles.detailItem}><Ionicons name="hourglass-outline" size={16} color={Colors.primary} /><Text style={styles.detailText}>{durationLabels[post.trainingDuration] || '1-2h'}</Text></View>
                </View>
                <Text style={styles.description} numberOfLines={expanded ? undefined : 3}>{post.description}</Text>
                {(post.description.length > 100 || post.additionalInfo) && (
                    <TouchableOpacity onPress={toggleExpand} style={styles.seeMoreBtn}>
                        <Text style={styles.seeMoreText}>{expanded ? 'Show less' : 'See more...'}</Text>
                    </TouchableOpacity>
                )}
                {expanded && post.additionalInfo && (
                    <View style={styles.additionalInfoBox}><Text style={styles.additionalInfoTitle}>Additional Info:</Text><Text style={styles.additionalInfoText}>{post.additionalInfo}</Text></View>
                )}
            </View>

            <View style={styles.footer}>
                <View style={styles.participantsBox}>
                    <Ionicons name="people" size={18} color={isParticipating ? Colors.primary : "#999"} />
                    <Text style={[styles.participantsText, isParticipating && styles.participatingText]}>
                        {participantsCount} / {post.maxParticipants || '∞'}
                    </Text>
                </View>

                <View style={styles.actionArea}>
                    {isOwnPost ? (
                        <View style={styles.ownPostContainer}>
                            {/* NOWOŚĆ: Privacy Badge */}
                            <View style={[styles.statusBadge, { marginRight: 8 }]}>
                                <Ionicons
                                    name={post.isPublic ? "eye-outline" : "lock-closed-outline"}
                                    size={14}
                                    color={post.isPublic ? Colors.primary : "#999"}
                                />
                                <Text style={[styles.statusText, { color: post.isPublic ? Colors.primary : "#999" }]}>
                                    {post.isPublic ? 'Public' : 'Private'}
                                </Text>
                            </View>

                            {/* Your Post Badge */}
                            <View style={styles.ownPostBadge}>
                                <Ionicons name="star" size={14} color={Colors.primary} />
                                <Text style={styles.ownPostText}>Your Post</Text>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.joinButton, isParticipating && styles.leaveButton]}
                            onPress={() => onToggleJoin && onToggleJoin(post.id, isParticipating)}
                        >
                            <Text style={[styles.joinButtonText, isParticipating && styles.leaveButtonText]}>
                                {isParticipating ? 'Leave' : 'Join Training'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
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
    levelBadge: { backgroundColor: '#8C7A3C', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    levelText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
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
    participatingText: { color: Colors.primary }, // Dodatkowe wyróźnienie
    joinButton: { backgroundColor: Colors.dark, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12 },
    joinButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    leaveButton: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#ff4444' },
    leaveButtonText: { color: '#ff4444' },

    actionArea: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ownPostContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 4,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    ownPostBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 5,
        borderWidth: 1,
        borderColor: '#FFE082',
    },
    ownPostText: { color: Colors.primary, fontWeight: 'bold', fontSize: 13 },
});