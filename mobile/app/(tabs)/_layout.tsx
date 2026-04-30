import { View, TextInput, Image, StyleSheet, TouchableOpacity, Platform, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { router, Tabs } from 'expo-router';
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../../constants/api";
import { useUser } from "../../context/UserContext";

const CustomHeader = () => {
    const { userData } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    useEffect(() => {
        if (searchTerm.length < 2) {
            setResults([]);
            setIsDropdownVisible(false);
            return;
        }

        const delay = setTimeout(async () => {
            try {
                const token = Platform.OS === 'web'
                    ? localStorage.getItem('userToken')
                    : await SecureStore.getItemAsync('userToken');

                const response = await fetch(`${API_URL}/api/users/${searchTerm}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setResults(data);
                    setIsDropdownVisible(true);
                }
            } catch (error) {
                console.error("Error searching users:", error);
            }
        }, 300);

        return () => clearTimeout(delay);
    }, [searchTerm]);

    const handleResultClick = (nickname: string) => {
        setIsDropdownVisible(false);
        setSearchTerm('');

        router.push({
            pathname: "/user/[nickname]",
            params: { nickname: nickname }
        });
    };

    return (
        <View style={styles.headerContainer}>
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search profiles..."
                        placeholderTextColor="#999"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        onFocus={() => searchTerm.length >= 2 && setIsDropdownVisible(true)}
                    />
                    {searchTerm.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchTerm(''); setIsDropdownVisible(false); }}>
                            <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>

                {isDropdownVisible && results.length > 0 && (
                    <View style={styles.dropdown}>
                        <FlatList
                            data={results}
                            keyExtractor={(item) => item.id.toString()}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.resultItem} onPress={() => handleResultClick(item.nickname)}>
                                    <Image
                                        source={{ uri: item.profilePicture || require("../../assets/images/no_avatar.png")}}
                                        style={styles.resultAvatar}
                                    />
                                    <View>
                                        <Text style={styles.resultName}>{item.nickname}</Text>
                                        <Text style={styles.resultLevel}>{item.level}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}
            </View>

            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                <Image
                    source={{ uri: userData?.profilePicture || require("../../assets/images/no_avatar.png") }}
                    style={styles.avatar}
                />
            </TouchableOpacity>
        </View>
    )
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                header: () => <CustomHeader />,
                tabBarActiveTintColor: Colors.dark,
                tabBarInactiveTintColor: '#999',
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    height: 80,
                    paddingBottom: 10,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                },
                tabBarShowLabel: false,
            }}
        >
            <Tabs.Screen name="home" options={{ tabBarIcon: ({ color, focused }) => (<View style={[styles.iconWrapper, focused && styles.activeIcon]}><Ionicons name="home" size={24} color={color} /></View>) }} />
            <Tabs.Screen name="profile" options={{ tabBarIcon: ({ color, focused }) => (<View style={[styles.iconWrapper, focused && styles.activeIcon]}><Ionicons name="person" size={24} color={color} /></View>) }} />
            <Tabs.Screen name="ads" options={{ tabBarIcon: ({ color, focused }) => (<View style={[styles.iconWrapper, focused && styles.activeIcon]}><Ionicons name="barbell" size={24} color={color} /></View>) }} />
            <Tabs.Screen name="statsScreen" options={{ tabBarIcon: ({ color, focused }) => (<View style={[styles.iconWrapper, focused && styles.activeIcon]}><Ionicons name="stats-chart" size={24} color={color} /></View>) }} />
            <Tabs.Screen name="settings" options={{ tabBarIcon: ({ color, focused }) => (<View style={[styles.iconWrapper, focused && styles.activeIcon]}><Ionicons name="settings" size={24} color={color} /></View>) }} />
        </Tabs>
    );
}

// @ts-ignore
const styles = StyleSheet.create({
    headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 45, paddingBottom: 15, backgroundColor: Colors.background, zIndex: 1000 },
    searchContainer: { flex: 1, marginRight: 15, position: 'relative', zIndex: 1000 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 20, paddingHorizontal: 15, height: 40, borderWidth: 1, borderColor: Colors.border },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 16, color: Colors.dark, outlineStyle: 'none'},
    dropdown: { position: 'absolute', top: 45, left: 0, right: 0, backgroundColor: Colors.surface, borderRadius: 15, borderWidth: 1, borderColor: Colors.border, maxHeight: 200, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10, zIndex: 9999 },
    resultItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    resultAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
    resultName: { fontSize: 14, fontWeight: 'bold', color: Colors.dark },
    resultLevel: { fontSize: 11, color: '#8C7A3C', fontWeight: 'bold' },
    avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: Colors.primary },
    iconWrapper: { marginTop: 5 },
    activeIcon: {}
});