import React from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PostCard from './PostCard';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

interface PostCarouselProps {
    title: string;
    posts: any[];
    onToggleJoin?: (postId: number, isParticipating: boolean) => void;
    onAddPress?: () => void;
    onDeletePost?: (postId: number) => void;
}

export default function PostCarousel({ title, posts, onToggleJoin, onAddPress, onDeletePost }: PostCarouselProps) {

    const renderAddCard = () => {
        if (!onAddPress) return null;
        return (
            <TouchableOpacity style={styles.addCard} onPress={onAddPress}>
                <Ionicons name="add" size={48} color="#ccc" />
                <Text style={styles.addCardText}>Add new post</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{posts.length}</Text>
                </View>
            </View>

            <FlatList
                data={posts}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.cardWrapper}>
                        <PostCard
                            post={item}
                            onToggleJoin={onToggleJoin}
                            onDeletePress={onDeletePost}
                        />
                    </View>
                )}

                ListFooterComponent={renderAddCard}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        marginBottom: 12,
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.dark,
    },
    countBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    countText: {
        fontSize: 12,
        color: Colors.dark,
        fontWeight: 'bold',
    },
    listContent: {
        //paddingHorizontal: 16,
        paddingBottom: 10,
    },
    cardWrapper: {
        width: width * 0.80,
        marginRight: 16,
    },
    addCard: {
        width: width * 0.85,
        marginRight: 16,
        borderWidth: 2,
        borderColor: '#ccc',
        borderStyle: 'dashed',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 220,
        backgroundColor: 'transparent',
    },
    addCardText: {
        marginTop: 10,
        color: '#ccc',
        fontSize: 16,
        fontWeight: 'bold',
    }
});