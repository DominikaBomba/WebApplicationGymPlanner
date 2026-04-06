import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Platform,
    TouchableOpacity,
    Modal,
    ScrollView, FlatList, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import CustomButton from '../../components/CustomButton';
import { Colors } from '../../constants/Colors';
import {API_URL} from "@/constants/api";
import {Ionicons} from "@expo/vector-icons";
import {useUser} from "@/context/UserContext";

export default function ProfileScreen(){
    const { userData, loading, logout } = useUser();
    const [friendsModalVisible, setFriendsModalVisible] = useState(false);

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
                // Navigation to friends profile
                console.log("Navigating to user ID:", item.id);
                setFriendsModalVisible(false);
            }}
        >
            <Image
                source={{ uri: item.profilePicture /* || można dodać jakiś defaultowy kidey nie ma progilowego*/ }}
                style={styles.friendAvatar}
            />
            <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{item.nickname}</Text>
                <Text style={styles.friendLevel}>{item.level}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

            {/*profile*/}
            <View style={styles.headerSection}>
                <View style={styles.headerTopRow}>
                    <Image
                        source={{ uri: userData?.profilePicture /* || można dodać jakiś defaultowy kidey nie ma progilowego*/ }}
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

            {/* Logout button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={Colors.red} />
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            {/* friends modal */}
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

    // --- Profile Header ---
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
    },
    bioText: {
        fontSize: 15,
        color: '#666',
        //textAlign: 'center',
        lineHeight: 22,
        marginBottom: 5,
        marginLeft: 5,
    },

    // --- Stats Row ---
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

    // --- Misc ---
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

    // --- Modal Styles ---
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
    }
});