import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import Sidebar from '../../components/layout/Sidebar';

const { width } = Dimensions.get('window');

const SYSTEM_ROLES = [
  { value: 'employee', emoji: '👷', color: ['#4facfe', '#00f2fe'] },
  { value: 'worker', emoji: '🔧', color: ['#43e97b', '#38f9d7'] },
  { value: 'supervisor', emoji: '👔', color: ['#fa709a', '#fee140'] },
];

const UserManagement = () => {
  const navigation = useNavigation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ shiftDate: '', shiftLocation: '' });
  const [roleUpdateUserId, setRoleUpdateUserId] = useState(null);
  const [operationRoles, setOperationRoles] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchOperationRoles();
  }, []);

  const fetchOperationRoles = async () => {
    try {
      const res = await api.get('/users/operational-roles');
      setOperationRoles(res.data || []);
    } catch (error) {
      console.error('Failed to load operational roles', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data || []);
    } catch (error) {
      console.error('Failed to load users', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter((user) => {
      const name = (user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [users, searchTerm]);

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString();
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const openShiftModal = (user) => {
    setSelectedUser(user);
    setFormData({
      shiftLocation: user.shiftLocation || '',
      shiftDate: formatDateForInput(user.shiftDate),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedUser) return;

    try {
      const payload = {
        shiftLocation: formData.shiftLocation,
        shiftDate: formData.shiftDate || null,
      };

      const res = await api.put(`/users/${selectedUser._id}/shift`, payload);
      const updatedUser = res.data?.user || selectedUser;

      setUsers((prev) => prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)));

      Alert.alert('✅ Success', 'Shift assignment updated');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to update shift assignment', error);
      const message = error.response?.data?.message || 'Failed to update shift assignment';
      Alert.alert('❌ Error', message);
    }
  };

  const handleSystemRoleChange = async (userId, role) => {
    try {
      setRoleUpdateUserId(userId);
      const res = await api.put(`/users/${userId}/system-role`, { role });
      const updatedUser = res.data?.user;
      if (updatedUser) {
        setUsers((prev) => prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
      }
      Alert.alert('✅ Success', 'System role updated');
    } catch (error) {
      console.error('Failed to update system role', error);
      const message = error.response?.data?.message || 'Failed to update system role';
      Alert.alert('❌ Error', message);
    } finally {
      setRoleUpdateUserId(null);
    }
  };

  const handleOperationRoleChange = async (userId, operationRole) => {
    try {
      setRoleUpdateUserId(userId);
      const res = await api.put(`/users/${userId}/role`, { operationRole });
      const updatedUser = res.data?.user;
      if (updatedUser) {
        setUsers((prev) => prev.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
      }
      Alert.alert('✅ Success', 'Operational role updated');
    } catch (error) {
      console.error('Failed to update operational role', error);
      const message = error.response?.data?.message || 'Failed to update operational role';
      Alert.alert('❌ Error', message);
    } finally {
      setRoleUpdateUserId(null);
    }
  };

  const getRoleEmoji = (role) => {
    const roleObj = SYSTEM_ROLES.find(r => r.value === role);
    return roleObj?.emoji || '👤';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
          <MaterialIcons name="menu" size={32} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>👥</Text>
          <Text style={styles.headerTitle}>User Management</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuButton}>
          <MaterialIcons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={28} color="#667eea" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#94a3b8"
        />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingEmoji}>⏳</Text>
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          <View style={styles.usersList}>
            {filteredUsers.map((user) => (
              <View key={user._id} style={styles.userCard}>
                <LinearGradient
                  colors={['#ffffff', '#f8f9fa']}
                  style={styles.userGradient}
                >
                  {/* User Header */}
                  <View style={styles.userHeader}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{getRoleEmoji(user.role)}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                    </View>
                  </View>

                  {/* System Role Selection */}
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>🎭 System Role</Text>
                    <View style={styles.roleButtons}>
                      {SYSTEM_ROLES.map((role) => (
                        <TouchableOpacity
                          key={role.value}
                          style={styles.roleButton}
                          onPress={() => handleSystemRoleChange(user._id, role.value)}
                          disabled={roleUpdateUserId === user._id}
                        >
                          <LinearGradient
                            colors={user.role === role.value ? role.color : ['#f1f5f9', '#e2e8f0']}
                            style={styles.roleGradient}
                          >
                            <Text style={styles.roleEmoji}>{role.emoji}</Text>
                            <Text style={[
                              styles.roleText,
                              user.role === role.value && styles.roleTextActive
                            ]}>
                              {role.value.charAt(0).toUpperCase() + role.value.slice(1)}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Operation Role (for employees only) */}
                  {user.role === 'employee' && operationRoles.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionLabel}>🔧 Operation Role</Text>
                      <View style={styles.roleButtons}>
                        {operationRoles.map((role) => (
                          <TouchableOpacity
                            key={role}
                            style={styles.opRoleButton}
                            onPress={() => handleOperationRoleChange(user._id, role)}
                            disabled={roleUpdateUserId === user._id}
                          >
                            <Text style={[
                              styles.opRoleText,
                              user.operationRole === role && styles.opRoleTextActive
                            ]}>
                              {role}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Shift Info */}
                  <View style={styles.shiftInfo}>
                    <View style={styles.shiftItem}>
                      <MaterialIcons name="calendar-today" size={20} color="#667eea" />
                      <Text style={styles.shiftText}>{formatDateForDisplay(user.shiftDate)}</Text>
                    </View>
                    <View style={styles.shiftItem}>
                      <MaterialIcons name="location-on" size={20} color="#667eea" />
                      <Text style={styles.shiftText}>{user.shiftLocation || 'Not assigned'}</Text>
                    </View>
                  </View>

                  {/* Assign Button */}
                  <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => openShiftModal(user)}
                  >
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.assignGradient}
                    >
                      <MaterialIcons name="edit-location" size={24} color="#fff" />
                      <Text style={styles.assignText}>
                        {user.shiftLocation || user.shiftDate ? 'Update Shift' : 'Assign Shift'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>
                📍 {selectedUser?.shiftLocation || selectedUser?.shiftDate ? 'Update' : 'Assign'} Shift
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <MaterialIcons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                {getRoleEmoji(selectedUser?.role)} {selectedUser?.name}
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📅 Shift Date</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.shiftDate}
                  onChangeText={(text) => setFormData({ ...formData, shiftDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>📍 Location</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.shiftLocation}
                  onChangeText={(text) => setFormData({ ...formData, shiftLocation: text })}
                  placeholder="e.g. Shaft A - Level 3"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsModalOpen(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.saveGradient}
                  >
                    <MaterialIcons name="save" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    marginBottom: 0,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
  },
  usersList: {
    gap: 16,
  },
  userCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  userGradient: {
    padding: 20,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 32,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  roleGradient: {
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  roleEmoji: {
    fontSize: 24,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  roleTextActive: {
    color: '#fff',
  },
  opRoleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  opRoleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  opRoleTextActive: {
    color: '#667eea',
    backgroundColor: '#e0e7ff',
  },
  shiftInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  shiftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shiftText: {
    fontSize: 14,
    color: '#1e293b',
  },
  assignButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  assignGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  assignText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default UserManagement;