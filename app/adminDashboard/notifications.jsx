import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../baseURL";

export default function NotificationManagement() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    role: "customer",
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem("user");
      const { accessToken } = JSON.parse(userData);

      const response = await axios.get(`${API_URL}/admin/notifications`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Error", "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNotification = () => {
    setEditingNotification(null);
    setFormData({
      title: "",
      description: "",
      role: "customer",
    });
    setSaving(false);
    setModalVisible(true);
  };

  const handleEditNotification = (notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      description: notification.description,
      role: notification.role,
    });
    setSaving(false);
    setModalVisible(true);
  };

  const handleSaveNotification = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setSaving(true);
      const userData = await AsyncStorage.getItem("user");
      const { accessToken } = JSON.parse(userData);

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        role: formData.role,
      };

      let response;
      if (editingNotification) {
        response = await axios.put(
          `${API_URL}/admin/notifications/${editingNotification._id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      } else {
        response = await axios.post(
          `${API_URL}/admin/notifications`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }

      if (response.data.success) {
        setModalVisible(false);
        fetchNotifications();
        Alert.alert(
          "Success",
          editingNotification
            ? "Notification updated successfully"
            : "Notification created successfully"
        );
      }
    } catch (error) {
      console.error("Error saving notification:", error);
      Alert.alert("Error", "Failed to save notification");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNotification = (notification) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteNotification(notification._id),
        },
      ]
    );
  };

  const deleteNotification = async (id) => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const { accessToken } = JSON.parse(userData);

      const response = await axios.delete(
        `${API_URL}/admin/notifications/${id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data.success) {
        fetchNotifications();
        Alert.alert("Success", "Notification deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      Alert.alert("Error", "Failed to delete notification");
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "customer":
        return "#3B82F6";
      case "provider":
        return "#10B981";
      case "all":
        return "#F59E0B"; // Keep for backward compatibility with existing notifications
      default:
        return "#6B7280";
    }
  };

  const renderNotificationCard = (notification) => (
    <View key={notification._id} style={styles.notificationCard}>
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <View style={styles.notificationActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditNotification(notification)}
          >
            <FontAwesome5 name="edit" size={14} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteNotification(notification)}
          >
            <FontAwesome5 name="trash" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.notificationDescription}>
        {notification.description}
      </Text>
      <View style={styles.notificationFooter}>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: getRoleColor(notification.role) + "20" },
          ]}
        >
          <Text
            style={[
              styles.roleText,
              { color: getRoleColor(notification.role) },
            ]}
          >
            {notification.role.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.dateText}>
          {new Date(notification.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchNotifications} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notification Management</Text>
          <Text style={styles.headerSubtitle}>
            Manage notifications for customers and providers
          </Text>
        </View>


        {/* Notifications List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="bell-slash" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              Create your first notification to get started
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map(renderNotificationCard)}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingNotification ? "Edit Notification" : "Add Notification"}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Title</Text>
                  <TextInput
                    style={[styles.textInput, saving && styles.disabledInput]}
                    value={formData.title}
                    onChangeText={(text) =>
                      setFormData({ ...formData, title: text })
                    }
                    placeholder="Enter notification title"
                    editable={!saving}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.textArea,
                      saving && styles.disabledInput,
                    ]}
                    value={formData.description}
                    onChangeText={(text) =>
                      setFormData({ ...formData, description: text })
                    }
                    placeholder="Enter notification description"
                    multiline
                    numberOfLines={4}
                    editable={!saving}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Target Role</Text>
                  <View style={styles.roleSelector}>
                    {["customer", "provider"].map((role) => (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.roleButton,
                          formData.role === role && styles.selectedRoleButton,
                          saving && styles.disabledButton,
                        ]}
                        onPress={() =>
                          setFormData({ ...formData, role })
                        }
                        disabled={saving}
                      >
                        <Text
                          style={[
                            styles.roleButtonText,
                            formData.role === role && styles.selectedRoleButtonText,
                          ]}
                        >
                          {role.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, saving && styles.disabledButton]}
                onPress={handleSaveNotification}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingNotification ? "Update" : "Create"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Add Button */}
      <View style={styles.bottomAddButtonContainer}>
        <TouchableOpacity
          style={[styles.bottomAddButton, saving && styles.disabledButton]}
          onPress={handleAddNotification}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <FontAwesome5 name="plus" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.bottomAddButtonText}>
            {saving ? "Creating..." : "Add Notification"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  notificationsList: {
    paddingBottom: 100,
  },
  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  notificationActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: "#EBF8FF",
  },
  deleteButton: {
    backgroundColor: "#FEF2F2",
  },
  notificationDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  notificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    minHeight: 400,
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    flex: 1,
    maxHeight: 300,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  roleSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 4,
    alignItems: "center",
  },
  selectedRoleButton: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  selectedRoleButtonText: {
    color: "#FFFFFF",
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  saveButton: {
    backgroundColor: "#3B82F6",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledInput: {
    backgroundColor: "#F3F4F6",
    color: "#9CA3AF",
  },
  bottomAddButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
  },
  bottomAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomAddButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
