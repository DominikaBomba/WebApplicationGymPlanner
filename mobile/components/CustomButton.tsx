import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';
import { Colors } from '../constants/Colors';

interface CustomButtonProps extends TouchableOpacityProps {
    title: string;
}

export default function CustomButton({ title, style, ...rest }: CustomButtonProps) {
    return (
        <TouchableOpacity style={[styles.button, style]} {...rest}>
            <Text style={styles.text}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: Colors.primary,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    text: {
        color: Colors.dark,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
