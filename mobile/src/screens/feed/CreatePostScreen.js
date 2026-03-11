import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Image,
    Alert,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { Picker } from '@react-native-picker/picker';
import api from '../../services/api';

const CreatePostScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('General');
    const [media, setMedia] = useState(null);
    const [uploading, setUploading] = useState(false);

    const pickMedia = async (type) => {
        try {
            let result;
            if (type === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(t('permission_needed', { defaultValue: 'Permission needed' }), t('camera_permission_required', { defaultValue: 'Camera permission is required.' }));
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.All,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 1,
                });
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(t('permission_needed', { defaultValue: 'Permission needed' }), t('camera_permission_required', { defaultValue: 'Photos permission is required.' }));
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.All,
                    allowsEditing: true,
                    quality: 1,
                });
            }

            if (!result.canceled) {
                setMedia({ uri: result.assets[0].uri, type: result.assets[0].type });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePost = async () => {
        if (!media) {
            Alert.alert(t('missing_media', { defaultValue: 'Missing Media' }), t('select_media_msg', { defaultValue: 'Please select an image or video to post.' }));
            return;
        }

        setUploading(true);
        try {
            // Upload Media
            const formData = new FormData();
            const uriParts = media.uri.split('.');
            const fileType = uriParts[uriParts.length - 1];

            formData.append('file', {
                uri: media.uri,
                name: `upload.${fileType}`,
                type: media.type === 'video' ? `video/${fileType}` : `image/${fileType}`,
            });

            // Assuming /upload endpoint exists and returns { url: '...' }
            const uploadRes = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const mediaUrl = uploadRes.data?.url;

            if (!mediaUrl) {
                throw new Error('Upload failed, no URL returned');
            }

            // Create Post
            const postData = {
                description,
                category,
                mediaUrl,
                mediaType: media.type || 'image',
            };

            const postRes = await api.post('/posts', postData);

            if (postRes.data?.status === 'pending') {
                Alert.alert(t('post_submitted', { defaultValue: 'Post Submitted' }), t('post_review_msg', { defaultValue: 'Your post is being reviewed by AI.' }), [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else if (postRes.data?.status === 'rejected') {
                Alert.alert(t('post_rejected', { defaultValue: 'Post Rejected' }), postRes.data.moderationReason || t('content_flagged', { defaultValue: 'Content flagged as irrelevant.' }));
            } else {
                Alert.alert(t('success_title', { defaultValue: 'Success' }), t('post_published', { defaultValue: 'Post published!' }), [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }

        } catch (error) {
            console.error('Post error:', error);
            Alert.alert(t('error_title', { defaultValue: 'Error' }), t('create_post_failed', { defaultValue: 'Failed to create post.' }) + ' ' + (error.response?.data?.message || error.message));
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>{t('cancel', { defaultValue: 'Cancel' })}</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('new_post', { defaultValue: 'New Post' })}</Text>
                <TouchableOpacity onPress={handlePost} disabled={uploading}>
                    {uploading ? <ActivityIndicator color="#2196F3" /> : <Text style={styles.postText}>{t('share', { defaultValue: 'Share' })}</Text>}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.inputContainer}>
                    <View style={styles.categoryRow}>
                        <Text style={styles.label}>{t('category', { defaultValue: 'Category' })}:</Text>
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
                        placeholder={t('write_caption', { defaultValue: 'Write a caption...' })}
                        multiline
                        value={description}
                        onChangeText={setDescription}
                    />

                    {media ? (
                        <View style={styles.previewContainer}>
                            {media.type === 'video' ? (
                                <Video
                                    source={{ uri: media.uri }}
                                    style={styles.mediaPreview}
                                    useNativeControls
                                    resizeMode="contain"
                                />
                            ) : (
                                <Image source={{ uri: media.uri }} style={styles.mediaPreview} />
                            )}
                            <TouchableOpacity style={styles.removeButton} onPress={() => setMedia(null)}>
                                <MaterialIcons name="close" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.uploadButtons}>
                            <TouchableOpacity style={styles.uploadBtn} onPress={() => pickMedia('image')}>
                                <MaterialIcons name="photo-library" size={24} color="#555" />
                                <Text style={styles.uploadBtnText}>{t('photo_video', { defaultValue: 'Photo/Video' })}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.uploadBtn} onPress={() => pickMedia('camera')}>
                                <MaterialIcons name="camera-alt" size={24} color="#555" />
                                <Text style={styles.uploadBtnText}>{t('camera', { defaultValue: 'Camera' })}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
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
    uploadButtons: {
        flexDirection: 'row',
        gap: 15,
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
        padding: 12,
        borderRadius: 8,
        gap: 6,
    },
    uploadBtnText: {
        fontWeight: '500',
        color: '#555',
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
    removeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 15,
        padding: 5,
    },
});

export default CreatePostScreen;
