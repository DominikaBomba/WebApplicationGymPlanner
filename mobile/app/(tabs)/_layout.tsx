import {View, TextInput, Image, StyleSheet, TouchableOpacity, Platform, Alert} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Wbudowane ikony Expo
import { Colors } from '../../constants/Colors';
import {router, Tabs} from 'expo-router';
import {inspect} from "node:util";
import {useEffect, useState} from "react";
import * as SecureStore from "expo-secure-store";
import {API_URL} from "@/constants/api";
import {useUser} from "@/context/UserContext";

const CustomHeader = () => {
    const {userData} = useUser();

    return (
        <View style={styles.headerContainer}>
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search profiles..."
                    placeholderTextColor="#999"
                />
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                <Image
                    source={{ uri: userData?.profilePicture /* || można dodać jakiś defaultowy kidey nie ma progilowego*/}}
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
                    elevation: 10, // Cień android
                    shadowColor: '#000', // Cień ios
                    shadowOpacity: 0.1,
                    height: 80,
                    paddingBottom: 10,

                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,


                },
                tabBarShowLabel: false, // podpisy ikonek
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrapper, focused && styles.activeIcon]}>
                            <Ionicons name="home" size={24} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrapper, focused && styles.activeIcon]}>
                            <Ionicons name="person" size={24} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="ads"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrapper, focused && styles.activeIcon]}>
                            <Ionicons name="barbell" size={24} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="plans"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrapper, focused && styles.activeIcon]}>
                            <Ionicons name="chatbubble" size={24} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrapper, focused && styles.activeIcon]}>
                            <Ionicons name="settings" size={24} color={color} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 45,
        paddingBottom: 15,
        backgroundColor: Colors.background,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 20,
        paddingHorizontal: 15,
        height: 40,
        marginRight: 15,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.dark,
        outlineColor: Colors.surface,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    iconWrapper: {
        marginTop:5,
    },
    activeIcon: {
        /*backgroundColor: Colors.primary,*/
    }
});