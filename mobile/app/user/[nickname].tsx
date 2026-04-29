import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import { Colors } from '../../constants/Colors';
import { API_URL } from '../../constants/api';
import { useUser } from '../../context/UserContext';
import PostCarousel from '../../components/PostCarousel';

export default function UserProfileScreen() {
    const { nickname } = useLocalSearchParams();
    const { userData, fetchUser } = useUser();

    const [targetUser, setTargetUser] = useState<any>(null);
    const [userPosts, setUserPosts] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const isMe = userData?.nickname === nickname;
    const isFriend = userData?.friends?.some((f: any) => f.nickname === nickname);

    const fetchUserProfile = useCallback(async () => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');

            const userRes = await fetch(`${API_URL}/api/users/${nickname}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const userDataResponse = await userRes.json();
            const fetchedUser = Array.isArray(userDataResponse) ? userDataResponse[0] : userDataResponse;

            if (!fetchedUser) {
                setLoading(false);
                return;
            }
            setTargetUser(fetchedUser);

            const postsRes = await fetch(`${API_URL}/api/posts/${fetchedUser.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (postsRes.ok) {
                const postsData = await postsRes.json();
                setUserPosts(postsData.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            }

        } catch (error) {
            console.error("Error fetching user profile:", error);
        } finally {
            setLoading(false);
        }
    }, [nickname]);

    useEffect(() => {
        if (isMe) {
            router.replace('/(tabs)/profile');
            return;
        }
        fetchUserProfile();
    }, [fetchUserProfile, isMe]);

    const handleAddFriend = async () => {
        if (!targetUser) return;
        setActionLoading(true);
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const response = await fetch(`${API_URL}/api/users/friends`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ friendId: targetUser.id })
            });

            if (response.ok) {
                Alert.alert("Success", `You are now friends with ${targetUser.nickname}!`);
                await fetchUser();
            } else {
                const errorData = await response.json();
                Alert.alert("Error", errorData.error || "Failed to add friend");
            }
        } catch (error) {
            Alert.alert("Error", "Network error occurred.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleJoin = async (postId: number, isParticipating: boolean) => {
        try {
            const token = Platform.OS === 'web'
                ? localStorage.getItem('userToken')
                : await SecureStore.getItemAsync('userToken');

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
                setUserPosts(prevPosts => prevPosts.map(post => {
                    if (post.id === postId) {
                        const currentCount = post._count?.participants || 0;
                        const newCount = isParticipating ? currentCount - 1 : currentCount + 1;

                        return {
                            ...post,
                            participants: isParticipating ? [] : [{ participantId: userData?.id }],
                            _count: { participants: newCount }
                        };
                    }
                    return post;
                }));
            } else {
                const errorData = await response.json();
                console.error("Failed to toggle join:", errorData);
                Alert.alert("Error", errorData.error || "Failed to join training.");
            }
        } catch (error) {
            console.error("Error during join/leave API call:", error);
            Alert.alert("Error", "Network error occurred.");
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    if (!targetUser) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.errorText}>User not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            {/* Header Nawigacyjny */}
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.dark} />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerSection}>
                    <View style={styles.headerTopRow}>
                        <Image source={{ uri: targetUser.profilePicture || 'https://via.placeholder.com/150' }} style={styles.avatarLarge} />
                        <View style={styles.headerTextInfo}>
                            <Text style={styles.nameText}>{targetUser.nickname}</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{targetUser.level}</Text>
                            </View>

                            {isFriend ? (
                                <View style={styles.friendBadge}>
                                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                                    <Text style={styles.friendBadgeText}>Friends</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.addFriendBtn}
                                    onPress={handleAddFriend}
                                    disabled={actionLoading}
                                >
                                    <Ionicons name="person-add" size={16} color={Colors.dark} />
                                    <Text style={styles.addFriendText}>{actionLoading ? "Adding..." : "Add Friend"}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <Text style={styles.bioText}>{targetUser.description || "No bio provided..."}</Text>
                </View>


                <PostCarousel
                    title={`${targetUser.nickname}'s Trainings`}
                    posts={userPosts}
                    emptyMessage="This user hasn't posted any workouts recently."
                    onToggleJoin={handleToggleJoin}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    errorText: { fontSize: 18, color: '#666' },

    navHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15, backgroundColor: Colors.background },
    backBtn: { padding: 5 },
    navTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.dark },
    scrollContent: { padding: 20, paddingBottom: 40 },

    headerSection: { backgroundColor: Colors.surface, padding: 20, borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    headerTopRow: { flexDirection: 'row' },
    avatarLarge: { width: 100, height: 100, borderRadius: 50, marginBottom: 15, marginRight: 15, borderWidth: 3, borderColor: Colors.primary },
    headerTextInfo: { flexDirection: 'column', alignItems: 'baseline', justifyContent: 'center', marginBottom: 15, flex: 1 },
    nameText: { fontSize: 24, fontWeight: 'bold', color: Colors.dark, marginBottom: 3 },
    badge: { backgroundColor: '#8C7A3C', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 10 },
    badgeText: { color: Colors.surface, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    bioText: { fontSize: 15, color: '#666', lineHeight: 22, marginTop: 10 },

    addFriendBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 5 },
    addFriendText: { color: Colors.dark, fontWeight: 'bold', fontSize: 14 },
    friendBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e6f9ed', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 5, borderWidth: 1, borderColor: Colors.primary },
    friendBadgeText: { color: Colors.primary, fontWeight: 'bold', fontSize: 14 },
});