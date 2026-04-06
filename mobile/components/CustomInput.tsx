import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors } from '../constants/Colors';

interface CustomInputProps extends TextInputProps {}

export default function CustomInput(props: CustomInputProps) {
    return (
        <TextInput
            style={styles.input}
            placeholderTextColor="#999"
            {...props}
        />
    );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: Colors.surface,
        color: Colors.dark,
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: Colors.primary,
        fontSize: 16,
    },
});
