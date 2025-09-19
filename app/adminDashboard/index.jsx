import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../baseURL";
import { profileUploadService } from "../../utils/profileUpload";

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) {
        Alert.alert("Error", "No user data found");
        return;
      }
      const parsedUser = JSON.parse(userData);
      
      // Use stored admin data if available, otherwise fetch from API
      if (parsedUser.adminData) {
        setAdminData(parsedUser.adminData);
        setFormData({
          username: parsedUser.adminData.username,
          email: parsedUser.adminData.email,
        });
      } else {
        // Fallback to API call if stored data not available
        const token = parsedUser.accessToken;
        const response = await axios.get(`${API_URL}/admin/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setAdminData(response.data.data);
        setFormData({
          username: response.data.data.username,
          email: response.data.data.email,
        });
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      Alert.alert("Error", "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const parsedUser = JSON.parse(userData);
      const token = parsedUser.accessToken;

      const response = await axios.put(`${API_URL}/admin/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update stored admin data
      const updatedUserData = {
        ...parsedUser,
        adminData: response.data.data,
        username: response.data.data.username,
        email: response.data.data.email,
      };
      await AsyncStorage.setItem("user", JSON.stringify(updatedUserData));

      setAdminData(response.data.data);
      setEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setFormData({
      username: adminData.username,
      email: adminData.email,
    });
    setEditing(false);
  };

  const handleChangePassword = async () => {
    if (updatingPassword) return; // Prevent multiple submissions

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters long");
      return;
    }

    if (!passwordData.currentPassword.trim()) {
      Alert.alert("Error", "Please enter your current password");
      return;
    }

    setUpdatingPassword(true);

    try {
      const userData = await AsyncStorage.getItem("user");
      const parsedUser = JSON.parse(userData);
      const token = parsedUser.accessToken;

      await axios.put(`${API_URL}/admin/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPasswordModalVisible(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      Alert.alert("Success", "Password updated successfully!");
    } catch (error) {
      
      // Handle specific error cases with proper alerts
      if (error.response?.data?.message) {
        if (error.response.data.message.includes("Current password is incorrect")) {
          Alert.alert(
            "Incorrect Password", 
            "The current password you entered is incorrect. Please check and try again.",
            [
              {
                text: "OK",
                onPress: () => {
                  // Clear current password field
                  setPasswordData({ ...passwordData, currentPassword: "" });
                }
              }
            ]
          );
        } else if (error.response.data.message.includes("Failed to update password")) {
          Alert.alert("Error", "Failed to update password. Please try again.");
        } else {
          Alert.alert("Error", error.response.data.message);
        }
      } else if (error.response?.status === 401) {
        Alert.alert("Error", "Session expired. Please login again.");
      } else if (error.response?.status === 400) {
        Alert.alert("Error", "Invalid request. Please check your information.");
      } else {
        Alert.alert("Error", "Network error. Please check your connection and try again.");
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  const pickImage = async () => {
    try {
      console.log("🔍 Starting image picker...");
      
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library to select a profile picture.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() }
          ]
        );
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log("🔍 Image picker result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log("🔍 Selected image URI:", result.assets[0].uri);
        await uploadProfilePicture(result.assets[0].uri);
      } else {
        console.log("🔍 Image picker was canceled or no assets");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const uploadProfilePicture = async (imageUri) => {
    try {
      await profileUploadService.uploadProfilePicture(
        imageUri,
        'admin',
        // Success callback
        (data) => {
          setAdminData(data);
          Alert.alert("Success", "Profile picture updated successfully!");
        },
        // Error callback
        (errorMessage) => {
          Alert.alert("Error", errorMessage);
        },
        // Progress callback (optional)
        (progress) => {
          console.log(`📤 Upload progress: ${progress}%`);
        }
      );
    } catch (error) {
      Alert.alert("Error", "Failed to upload profile picture. Please try again.");
    }
  };

  const removeProfilePicture = async () => {
    Alert.alert(
      "Remove Profile Picture",
      "Are you sure you want to remove your profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await profileUploadService.removeProfilePicture(
                'admin',
                // Success callback
                (data) => {
                  setAdminData(data);
                  Alert.alert("Success", "Profile picture removed successfully!");
                },
                // Error callback
                (errorMessage) => {
                  Alert.alert("Error", errorMessage);
                }
              );
            } catch (error) {
              Alert.alert("Error", "Failed to remove profile picture");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading admin data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileContainer}>
          <View style={styles.profileImageContainer}>
            {adminData?.profilePic ? (
              <Image source={{ uri: adminData.profilePic }} style={styles.profileImage} />
            ) : (
              <View style={styles.defaultProfileImage}>
                <MaterialIcons name="person" size={50} color="#6200ee" />
              </View>
            )}
            <TouchableOpacity style={styles.editImageButton} onPress={pickImage}>
              <MaterialIcons name="camera-alt" size={20} color="white" />
            </TouchableOpacity>
            {adminData?.profilePic && (
              <TouchableOpacity style={styles.removeImageButton} onPress={removeProfilePicture}>
                <MaterialIcons name="close" size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.userName}>{adminData?.username || "Admin"}</Text>
          <Text style={styles.userRole}>Super Admin</Text>
        </View>

        {/* Profile Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            {!editing ? (
              <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                <MaterialIcons name="edit" size={20} color="#6200ee" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.detailItem}>
            <MaterialIcons name="person" size={20} color="#6200ee" />
            <TextInput
              style={[styles.detailText, editing && styles.editableText]}
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              editable={editing}
              placeholder="Username"
            />
          </View>

          <View style={styles.detailItem}>
            <MaterialIcons name="email" size={20} color="#6200ee" />
            <Text style={styles.detailText}>
              {formData.email}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={() => setPasswordModalVisible(true)}
          >
            <MaterialIcons name="lock" size={20} color="#6200ee" />
            <Text style={styles.changePasswordText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={16} color="#6200ee" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={passwordModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.passwordInput, updatingPassword && styles.passwordInputDisabled]}
                    value={passwordData.currentPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                    placeholder="Enter current password"
                    secureTextEntry={!showPasswords.current}
                    editable={!updatingPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  >
                    <Ionicons
                      name={showPasswords.current ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.passwordInput, updatingPassword && styles.passwordInputDisabled]}
                    value={passwordData.newPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                    placeholder="Enter new password"
                    secureTextEntry={!showPasswords.new}
                    editable={!updatingPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  >
                    <Ionicons
                      name={showPasswords.new ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.passwordInput, updatingPassword && styles.passwordInputDisabled]}
                    value={passwordData.confirmPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                    placeholder="Confirm new password"
                    secureTextEntry={!showPasswords.confirm}
                    editable={!updatingPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  >
                    <Ionicons
                      name={showPasswords.confirm ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelButton, updatingPassword && styles.modalCancelButtonDisabled]}
                onPress={() => setPasswordModalVisible(false)}
                disabled={updatingPassword}
              >
                <Text style={[styles.modalCancelButtonText, updatingPassword && styles.modalCancelButtonTextDisabled]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, updatingPassword && styles.modalSaveButtonDisabled]}
                onPress={handleChangePassword}
                disabled={updatingPassword}
              >
                {updatingPassword ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={[styles.modalSaveButtonText, { marginLeft: 8 }]}>Updating...</Text>
                  </View>
                ) : (
                  <Text style={styles.modalSaveButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  profileContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#6200ee",
  },
  defaultProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#6200ee",
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6200ee",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  removeImageButton: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#ff4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: "#6200ee",
    fontWeight: "500",
    backgroundColor: "#f3e5f5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailsContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3e5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#6200ee",
    fontWeight: "600",
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#6200ee",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailText: {
    fontSize: 16,
    color: "#555",
    marginLeft: 12,
    flex: 1,
  },
  editableText: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  changePasswordButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  changePasswordText: {
    fontSize: 16,
    color: "#6200ee",
    marginLeft: 12,
    flex: 1,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "90%",
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F8F9FA",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 24,
  },
  modalBodyContent: {
    paddingVertical: 24,
    flexGrow: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  input: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#1F2937",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1F2937",
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F8F9FA",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#6200ee",
    alignItems: "center",
    shadowColor: "#6200ee",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalSaveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  modalSaveButtonDisabled: {
    backgroundColor: "#9E9E9E",
    shadowOpacity: 0.1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButtonDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  modalCancelButtonTextDisabled: {
    color: "#BDBDBD",
  },
  passwordInputDisabled: {
    backgroundColor: "#F5F5F5",
    color: "#BDBDBD",
  },
});

export default AdminDashboard;