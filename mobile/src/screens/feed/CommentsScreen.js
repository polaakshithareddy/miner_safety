import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';


const CommentsScreen = ({ navigation, route }) => {
    const { postId } = route.params;
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [text, setText] = useState('');

    useEffect(() => {
        fetchComments();
    }, []);

    const fetchComments = async () => {
        try {
            // Fetch post to get fresh comments
            const response = await api.get(`/posts/${postId}`);
            setComments(response.data.comments || []);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!text.trim()) return;
        setSubmitting(true);
        try {
            const response = await api.post(`/posts/${postId}/comments`, { text: text.trim() });
            setComments(response.data); // Backend returns updated comments list
            setText('');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId) => {
        Alert.alert('Delete Comment', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/posts/${postId}/comments/${commentId}`);
                        setComments(prev => prev.filter(c => c._id !== commentId));
                    } catch (error) {
                        console.error(error);
                        Alert.alert('Error', 'Failed to delete comment');
                    }
                }
            }
        ]);
    };

    // Date formatter fallback
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderItem = ({ item }) => {
        const isAuthor = item.user?._id === user._id;
        const isSupervisor = user.role === 'supervisor' || user.role === 'admin';
        const canDelete = isAuthor || isSupervisor;

        return (
            <View style={styles.commentItem}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.user?.name?.charAt(0) || 'U'}</Text>
                </View>
                <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                        <Text style={styles.userName}>{item.user?.name || 'Unknown'}</Text>
                        <Text style={styles.timeText}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.commentText}>{item.text}</Text>
                </View>
                {canDelete && (
                    <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteButton}>
                        <MaterialIcons name="close" size={16} color="#999" />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Comments</Text>
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={comments}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No comments yet. Be the first!</Text>}
                />
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Add a comment..."
                    value={text}
                    onChangeText={setText}
                    multiline
                />
                <TouchableOpacity onPress={handleSend} disabled={submitting || !text.trim()}>
                    {submitting ? (
                        <ActivityIndicator size="small" color="#2196F3" />
                    ) : (
                        <MaterialIcons name="send" size={24} color={text.trim() ? "#2196F3" : "#ccc"} />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 15
    },
    list: {
        padding: 15
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    avatarText: {
        fontWeight: 'bold',
        color: '#666',
        fontSize: 16
    },
    commentContent: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 10,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4
    },
    userName: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333'
    },
    timeText: {
        fontSize: 10,
        color: '#999'
    },
    commentText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20
    },
    deleteButton: {
        marginLeft: 10,
        justifyContent: 'center'
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 50
    },
    inputContainer: {
        padding: 10,
        paddingBottom: 30, // Safe area
        borderTopWidth: 1,
        borderTopColor: '#eee',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    input: {
        flex: 1,
        backgroundColor: '#f0f2f5',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        maxHeight: 100
    }
});

export default CommentsScreen;
