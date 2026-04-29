import React, { useState, useCallback } from 'react';
import {
    View, StyleSheet, ScrollView, RefreshControl,
    ActivityIndicator, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { router, useFocusEffect } from 'expo-router';

import { Colors } from '../../constants/Colors';
import { API_URL } from '../../constants/api';
import { useUser } from '../../context/UserContext';
import { toggleJoinTraining } from '../../services/postService';
import PostCarousel from '../../components/PostCarousel';
import FloatingActionButton from '../../components/FloatingActionButton';

export default function HomeScreen() {
    const { userData } = useUser();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [joinedPosts, setJoinedPosts] = useState<any[]>([]);
    const [myPosts, setMyPosts] = useState<any[]>([]);
    const [friendsPosts, setFriendsPosts] = useState<any[]>([]);

    const fetchFeed = async (endpoint: string, token: string | null) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Error fetching from ${endpoint}`);
        return response.json();
    };

    const loadAllFeeds = useCallback(async () => {
        if (!userData?.id) return;

        try {
            const token = Platform.OS === 'web'
                ? localStorage.getItem('userToken')
                : await SecureStore.getItemAsync('userToken');

            const [joined, mine, friends] = await Promise.all([
                fetchFeed('/api/posts/joined', token),
                fetchFeed(`/api/posts/${userData.id}`, token),
                fetchFeed('/api/posts/friends-feed', token)
            ]);

            const sortByDate = (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime();

            setJoinedPosts(joined.sort(sortByDate));
            setMyPosts(mine.sort(sortByDate));
            setFriendsPosts(friends.sort(sortByDate));
        } catch (error) {
            console.error("Error loading home feeds:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userData?.id]);

    useFocusEffect(
        useCallback(() => {
            loadAllFeeds();
        }, [loadAllFeeds])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadAllFeeds();
    }, [loadAllFeeds]);

    const handleToggleJoin = async (postId: number, isParticipating: boolean) => {
        const success = await toggleJoinTraining(postId, isParticipating);

        if (success) {
            const updateArray = (posts: any[]) => posts.map(post => {
                if (post.id === postId) {
                    const currentCount = post._count?.participants || 0;
                    return {
                        ...post,
                        participants: isParticipating ? [] : [{ participantId: userData?.id }],
                        _count: { participants: isParticipating ? currentCount - 1 : currentCount + 1 }
                    };
                }
                return post;
            });

            setFriendsPosts(updateArray);

            if (isParticipating) {
                setJoinedPosts(prev => prev.filter(p => p.id !== postId));
            } else {
                const fullPost = [...joinedPosts, ...myPosts, ...friendsPosts].find(p => p.id === postId);
                if (fullPost) {
                    const joinedPost = {
                        ...fullPost,
                        participants: [{ participantId: userData?.id }],
                        _count: { participants: (fullPost._count?.participants || 0) + 1 }
                    };
                    setJoinedPosts(prev => [...prev, joinedPost].sort((a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    ));
                }
            }
        }
    };

    const handleDeletePost = async (postId: number) => {
        try {
            const token = Platform.OS === 'web'
                ? localStorage.getItem('userToken')
                : await SecureStore.getItemAsync('userToken');

            const response = await fetch(`${API_URL}/api/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setMyPosts(prev => prev.filter(p => p.id !== postId));
                setJoinedPosts(prev => prev.filter(p => p.id !== postId));
                setFriendsPosts(prev => prev.filter(p => p.id !== postId));
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['bottom']} style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                <PostCarousel
                    title="Joined Trainings"
                    posts={joinedPosts}
                    emptyMessage="You haven't joined any trainings yet."
                    onToggleJoin={handleToggleJoin}
                    onDeletePost={handleDeletePost}
                />

                <PostCarousel
                    title="My Training Ads"
                    posts={myPosts}
                    onAddPress={() => router.push('/add-post')}
                    onToggleJoin={handleToggleJoin}
                    onDeletePost={handleDeletePost}
                />

                <PostCarousel
                    title="Friends Activity"
                    posts={friendsPosts}
                    emptyMessage="Your friends haven't posted any workouts recently."
                    onToggleJoin={handleToggleJoin}
                    onDeletePost={handleDeletePost}
                />
                <View style={{ height: 80 }} />
            </ScrollView>

            <FloatingActionButton onPress={() => router.push('/add-post')} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 20
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingTop: 10,
    }
});