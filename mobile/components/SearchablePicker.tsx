import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// Używamy typu generycznego <T>, aby komponent mógł przyjmować i stringi, i całe obiekty
interface SearchablePickerProps<T> {
    data: T[];
    value: T | null;
    onSelect: (item: T | null) => void;
    labelExtractor: (item: T) => string; // Funkcja wyciągająca tekst do wyświetlenia
    keyExtractor: (item: T) => string;   // Funkcja wyciągająca unikalne ID
    placeholder: string;
    searchPlaceholder?: string;
}

export default function SearchablePicker<T>({
                                                data,
                                                value,
                                                onSelect,
                                                labelExtractor,
                                                keyExtractor,
                                                placeholder,
                                                searchPlaceholder = 'Search...'
                                            }: SearchablePickerProps<T>) {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filtrowanie danych na podstawie wpisanego tekstu
    const filteredData = useMemo(() => {
        if (!searchQuery) return data;
        return data.filter(item =>
            labelExtractor(item).toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [data, searchQuery, labelExtractor]);

    const handleSelect = (item: T | null) => {
        onSelect(item);
        setModalVisible(false);
        setSearchQuery(''); // Czyszczenie wyszukiwarki po wybraniu
    };

    // @ts-ignore
    // @ts-ignore
    return (
        <>
            {/* Przycisk otwierający Modal (wyglądający jak input) */}
            <TouchableOpacity
                style={styles.triggerButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={[styles.triggerText, !value && styles.placeholderText]}>
                    {value ? labelExtractor(value) : placeholder}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>

            {/* Modal z wyszukiwarką */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    {/* Header Modala */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{placeholder}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color={Colors.dark} />
                        </TouchableOpacity>
                    </View>

                    {/* Pasek Wyszukiwania */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                        <TextInput
                            // @ts-ignore
                            style={styles.searchInput}
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus={true} // Od razu otwiera klawiaturę
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color="#ccc" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Opcja "Clear / Dowolne" */}
                    <TouchableOpacity
                        style={styles.clearOption}
                        onPress={() => handleSelect(null)}
                    >
                        <Text style={styles.clearOptionText}>Clear selection (Any)</Text>
                    </TouchableOpacity>

                    {/* Lista wyników */}
                    <FlatList
                        data={filteredData}
                        keyExtractor={keyExtractor}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.itemRow}
                                onPress={() => handleSelect(item)}
                            >
                                <Text style={styles.itemText}>{labelExtractor(item)}</Text>
                                {/* Znacznik zaznaczenia, jeśli to ten item */}
                                {value && keyExtractor(value) === keyExtractor(item) && (
                                    <Ionicons name="checkmark" size={24} color={Colors.primary} />
                                )}
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No results found.</Text>
                        }
                    />
                </SafeAreaView>
            </Modal>
        </>
    );
}

// @ts-ignore
const styles = StyleSheet.create({
    triggerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 15,
        borderRadius: 12,
    },
    triggerText: {
        fontSize: 16,
        color: Colors.dark,
    },
    placeholderText: {
        color: '#999',
    },
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
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        margin: 15,
        paddingHorizontal: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        height: 50,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.dark,
        outlineStyle: 'none', // Dla Web

    },
    clearOption: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        alignItems: 'center',
    },
    clearOptionText: {
        color: '#ff4444',
        fontWeight: 'bold',
        fontSize: 16,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    itemText: {
        fontSize: 16,
        color: Colors.dark,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#999',
        fontSize: 16,
    }
});