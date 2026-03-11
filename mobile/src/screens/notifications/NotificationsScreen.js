import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNotifications } from '../../context/NotificationContext';
import { MaterialIcons } from '@expo/vector-icons';

const NotificationsScreen = ({ navigation }) => {
    const { notifications } = useNotifications();

    const renderItem = ({ item }) => (
        <View style={styles.item}>
            <View style={styles.iconContainer}>
                <MaterialIcons name="notifications" size={24} color="#fff" />
            </View>
            <View style={styles.content}>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item, index) => item._id || index.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.empty}>No new notifications</Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc'
    },
    header: {
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    list: {
        padding: 15
    },
    item: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    content: {
        flex: 1
    },
    message: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
        lineHeight: 20
    },
    time: {
        fontSize: 12,
        color: '#999'
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999'
    }
});

export default NotificationsScreen;
