import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface FloatingActionButtonProps {
    onPress: () => void;
    iconName?: keyof typeof Ionicons.glyphMap;
}

export default function FloatingActionButton({ onPress, iconName = 'add' }: FloatingActionButtonProps) {
    return (
        <TouchableOpacity style={styles.fab} onPress={onPress}>
            <Ionicons name={iconName} size={32} color="#fff" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.dark,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    }
});
