import React, {useCallback, useEffect, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Platform,
    TouchableOpacity,
    Modal,
    ScrollView, FlatList, Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { router, useFocusEffect } from 'expo-router';
import CustomButton from '../../components/CustomButton';
import { Colors } from '../../constants/Colors';
import {API_URL} from "@/constants/api";
import {Ionicons} from "@expo/vector-icons";
import {useUser} from "@/context/UserContext";
import PostCarousel from '../../components/PostCarousel';
import PlanCarousel from '../../components/PlanCarousel';
import PlanCreatorModal from '../../components/PlanCreatorModal';
import PlanCard from "@/components/PlanCard";
import { getOfflinePlans, removePlanOffline } from '../../services/localDatabase';

export default function ProfileScreen(){
    const { userData, loading, logout, fetchUser } = useUser();
    const [friendsModalVisible, setFriendsModalVisible] = useState(false);

    const [myPosts, setMyPosts] = useState<any[]>([]);
    const [myPlans, setMyPlans] = useState<any[]>([]);
    const [offlinePlans, setOfflinePlans] = useState<any[]>([]);

    const [postsLoading, setPostsLoading] = useState(true);
    const [plansLoading, setPlansLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [viewMode, setViewMode] = useState<'all' | 'offline'>('all');
    const [isPlanCreatorVisible, setIsPlanCreatorVisible] = useState(false);

    const loadOfflinePlans = async () => {
        const plans = await getOfflinePlans();
        setOfflinePlans(plans);
    };

    const fetchMyPosts = useCallback(async () => {
        if (!userData?.id) return;
        try {
            const token = Platform.OS === 'web'
                ? localStorage.getItem('userToken')
                : await SecureStore.getItemAsync('userToken');

            const response = await fetch(`${API_URL}/api/posts/${userData.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const sorted = data.sort((a: any, b: any) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                );
                setMyPosts(sorted);
            }
        } catch (error) {
            console.error("Error fetching user posts:", error);
        } finally {
            setPostsLoading(false);
            setRefreshing(false);
        }
    }, [userData?.id]);

    const fetchMyPlans = useCallback(async () => {
        if (!userData?.id) return;
        setPlansLoading(true);
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const response = await fetch(`${API_URL}/api/plans/my-plans`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setMyPlans(await response.json());
                setViewMode('all');
            } else {
                throw new Error("API request failed");
            }
        } catch (error) {
            console.error("Network error, switching to Offline Mode:", error);
            await loadOfflinePlans();
            setViewMode('offline');
            if (Platform.OS !== 'web') {
                Alert.alert("Offline Mode", "Could not connect to server. Showing downloaded plans.");
            }
        } finally {
            setPlansLoading(false);
            setRefreshing(false);
        }
    }, [userData?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchMyPosts();
            fetchMyPlans();
            loadOfflinePlans();
        }, [fetchMyPosts])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUser();
        fetchMyPosts();
        fetchMyPlans();
    }, [fetchUser, fetchMyPosts]);

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    }

    if(loading || !userData){
        return(
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    const renderFriendItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.friendCard}
            onPress={() => {
                setFriendsModalVisible(false);
                router.push({
                    pathname: "/user/[nickname]",
                    params: { nickname: item.nickname }
                });
            }}
        >
            <Image
                source={{ uri: item.profilePicture || require("../../assets/images/no_avatar.png") }}
                style={styles.friendAvatar}
            />
            <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.nickname}</Text>
                <Text style={styles.friendLevel}>{item.level}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
    );

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
            } else {
                console.error("Error deleting post:", postId);
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const handleDeletePlan = async (planId: number) => {
        try {
            const token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
            const response = await fetch(`${API_URL}/api/plans/${planId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setMyPlans(prev => prev.filter(p => p.id !== planId));
            } else {
                Alert.alert("Error", "Failed to delete the plan");
            }
        } catch (error) {
            Alert.alert("Error", "Network error occurred.");
        }
    };

    const handleRemoveOfflinePlan = async (planId: number) => {
        const success = await removePlanOffline(planId);
        if (success) {
            setOfflinePlans(prev => prev.filter(p => p.id !== planId));
        }
    };

    const FilterToggle = () => (
        <View style={styles.toggleContainer}>
            <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'all' && styles.toggleBtnActive]}
                onPress={() => setViewMode('all')}
            >
                <Text style={[styles.toggleText, viewMode === 'all' && styles.toggleTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'offline' && styles.toggleBtnActive]}
                onPress={() => {
                    setViewMode('offline');
                    loadOfflinePlans();
                }}
            >
                <Text style={[styles.toggleText, viewMode === 'offline' && styles.toggleTextActive]}>Offline</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
            }>

            <View style={styles.headerSection}>
                <View style={styles.headerTopRow}>
                    <Image
                        source={{ uri: userData?.profilePicture || require("../../assets/images/no_avatar.png")}}
                        style={styles.avatarLarge}
                    />

                    <View style={styles.headerTextInfo}>
                        <Text style={styles.nameText}>{userData?.nickname || 'Unknown User'}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{userData?.level || 'BEGINNER'}</Text>
                        </View>
                        <View style={styles.friendsRow}>
                            <TouchableOpacity
                                style={styles.friendsBox}
                                onPress={() => setFriendsModalVisible(true)}
                            >

                                <Text style={styles.friendsLabel}>Friends</Text>
                                <Text style={styles.friendsNumber}>{userData?.friends?.length || 0}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>


                <Text style={styles.bioText}>
                    {userData?.description || "No bio provided..."}
                </Text>
            </View>

            {postsLoading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
            ) : (
                <PostCarousel
                    title="My training ads"
                    posts={myPosts}
                    onAddPress={() => router.push('/add-post')}
                    onDeletePost={handleDeletePost}
                />
            )}

            {plansLoading && viewMode === 'all' ? (
                <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
            ) : (
                <PlanCarousel
                    title="My training plans"
                    plans={viewMode === 'all' ? myPlans : offlinePlans}
                    onDeletePlan={viewMode === 'all' ? handleDeletePlan : handleRemoveOfflinePlan}
                    onAddPress={viewMode === 'all' ? () => setIsPlanCreatorVisible(true) : undefined}

                    emptyMessage={viewMode === 'offline' ? "No downloaded plans for offline use." : undefined}
                    headerAction={<FilterToggle />}
                />
            )}

            <PlanCreatorModal
                visible={isPlanCreatorVisible}
                onClose={() => setIsPlanCreatorVisible(false)}
                onSaved={(newPlanId) => {
                    setIsPlanCreatorVisible(false);
                    fetchMyPlans();
                }}
            />

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={Colors.red} />
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <Modal
                visible={friendsModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setFriendsModalVisible(false)} // handles hardware back button on Android
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Your Friends</Text>
                        <TouchableOpacity onPress={() => setFriendsModalVisible(false)} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={Colors.dark} />
                        </TouchableOpacity>
                    </View>

                    {userData?.friends && userData.friends.length > 0 ? (
                        <FlatList
                            data={userData.friends}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderFriendItem}
                            contentContainerStyle={styles.friendsList}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyStateText}>You don't have any friends yet.</Text>
                        </View>
                    )}
                </SafeAreaView>
            </Modal>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },

    headerSection: {
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 24,
        //alignItems: 'center',
        marginBottom: 20,
        // Shadows
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },

    headerTopRow: {
        flexDirection: 'row',
    },

    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 15,
        marginRight: 10,
        borderWidth: 3,
        borderColor: Colors.primary,
    },
    headerTextInfo: {
        flexDirection: 'column',
        alignItems: 'baseline',
        justifyContent: 'center',
        marginBottom: 15,
        width: 'auto',
    },
    nameText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.dark,
        marginBottom: 3,
    },
    badge: {
        backgroundColor: '#8C7A3C',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        width: 'auto',
    },
    badgeText: {
        color: Colors.surface,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginHorizontal: 5,
    },
    bioText: {
        fontSize: 15,
        color: '#666',
        //textAlign: 'center',
        lineHeight: 22,
        marginBottom: 5,
        marginLeft: 5,
    },

    friendsRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'flex-start',
        width: '100%',

    },
    friendsBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 10,
        //paddingHorizontal: 20,
    },
    friendsNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark,
        marginLeft: 5,
    },
    friendsLabel: {
        fontSize: 12,
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },

    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        padding: 15,
        backgroundColor: Colors.surface,
        borderRadius: 12,
    },
    logoutText: {
        marginLeft: 8,
        color: Colors.red,
        fontSize: 16,
        fontWeight: 'bold',
    },

//modals
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.dark,
    },
    closeButton: {
        padding: 5,
    },
    friendsList: {
        padding: 20,
    },
    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 15,
        borderRadius: 16,
        marginBottom: 10,
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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateText: {
        marginTop: 10,
        color: '#999',
        fontSize: 16,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#EEEEEE',
        borderRadius: 20,
        padding: 4,
    },
    toggleBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    toggleBtnActive: {
        backgroundColor: Colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#999',
    },
    toggleTextActive: {
        color: Colors.dark,
    }
});