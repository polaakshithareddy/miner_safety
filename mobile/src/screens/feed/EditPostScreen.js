import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Video, ResizeMode } from 'expo-av';
import api, { BASE_URL } from '../../services/api';

const EditPostScreen = ({ navigation, route }) => {
    const { post } = route.params;
    const [description, setDescription] = useState(post.description || '');
    const [category, setCategory] = useState(post.category || 'General');
    const [saving, setSaving] = useState(false);

    const getFullUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${BASE_URL}${url}`;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updateData = {
                description,
                category
            };

            const res = await api.put(`/posts/${post._id}`, updateData);

            Alert.alert('Success', 'Post updated!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Update error:', error);
            Alert.alert('Error', 'Failed to update post.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Post</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color="#2196F3" /> : <Text style={styles.postText}>Save</Text>}
                </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
                <View style={styles.categoryRow}>
                    <Text style={styles.label}>Category:</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={category}
                            onValueChange={(itemValue) => setCategory(itemValue)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Hazard" value="Hazard" />
                            <Picker.Item label="Incident" value="Incident" />
                            <Picker.Item label="General" value="General" />
                            <Picker.Item label="Safety Update" value="Safety Update" />
                        </Picker>
                    </View>
                </View>

                <TextInput
                    style={styles.textInput}
                    placeholder="Write a caption..."
                    multiline
                    value={description}
                    onChangeText={setDescription}
                />

                <Text style={styles.label}>Media (Cannot be changed):</Text>
                <View style={styles.previewContainer}>
                    {post.mediaType === 'video' ? (
                        <Video
                            source={{ uri: getFullUrl(post.mediaUrl) }}
                            style={styles.mediaPreview}
                            useNativeControls
                            resizeMode={ResizeMode.CONTAIN}
                        />
                    ) : (
                        <Image
                            source={{ uri: getFullUrl(post.mediaUrl) }}
                            style={styles.mediaPreview}
                            resizeMode="cover"
                        />
                    )}
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    cancelText: {
        fontSize: 16,
        color: '#666',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    postText: {
        fontSize: 16,
        color: '#2196F3', // Blue
        fontWeight: 'bold',
    },
    inputContainer: {
        padding: 20,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 10,
        marginBottom: 5,
    },
    pickerContainer: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
    },
    picker: {
        height: 50,
    },
    textInput: {
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    previewContainer: {
        marginTop: 10,
        position: 'relative',
        height: 300,
        backgroundColor: '#000',
        borderRadius: 8,
        overflow: 'hidden',
    },
    mediaPreview: {
        width: '100%',
        height: '100%',
    },
});

export default EditPostScreen;
