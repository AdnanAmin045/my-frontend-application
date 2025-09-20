import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import { API_URL } from "../../baseURL";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ProfileUploadService } from '../../utils/profileUpload';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Zod validation schema
const providerUpdateSchema = z.object({
  username: z
    .string()
    .min(1, "Business name is required")
    .min(3, "Business name must be at least 3 characters"),
  phoneNo: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\d{11}$/, "Phone number must be exactly 11 digits"),
  shopAddress: z
    .string()
    .min(1, "Shop address is required")
    .min(10, "Shop address must be at least 10 characters"),
});

export default function ProviderProfile() {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingPic, setUpdatingPic] = useState(false);
  
  // Initialize profile upload service
  const profileUploadService = new ProfileUploadService();
  
  // React Hook Form setup
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(providerUpdateSchema),
    defaultValues: {
      username: '',
      phoneNo: '',
      shopAddress: ''
    },
  });

  useEffect(() => {
    const fetchProviderProfile = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (!userData) {
          setError("No user data found in storage");
          setLoading(false);
          return;
        }
        
        const parsedUser = JSON.parse(userData);
        const token = parsedUser.accessToken;
        
        if (!token) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_URL}/users/provider/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.data.success) {
          setProvider(response.data.data);
          setValue("username", response.data.data.username || '');
          setValue("phoneNo", response.data.data.phoneNo || '');
          setValue("shopAddress", response.data.data.shopAddress || '');
        } else {
          setError(response.data.message || "Failed to load profile");
        }
        setError(null);
      } catch (error) {
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProviderProfile();
  }, []);

  const pickImage = async () => {
    try {
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

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const uploadProfilePicture = async (imageUri) => {
    try {
      await profileUploadService.uploadProfilePicture(
        imageUri,
        'provider',
        // Success callback
        (data) => {
          setProvider(data);
          Alert.alert("Success", "Profile picture updated successfully!");
        },
        // Error callback
        (error) => {
          Alert.alert("Error", `Failed to update profile picture: ${error}`);
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
            setUpdatingPic(true);
            try {
              const userData = await AsyncStorage.getItem("user");
              const parsedUser = JSON.parse(userData);
              const token = parsedUser.accessToken;

              const response = await axios.delete(`${API_URL}/users/provider/profile-pic`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (response.status === 200) {
                setProvider(response.data.data);
                Alert.alert("Success", "Profile picture removed successfully!");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to remove profile picture");
            } finally {
              setUpdatingPic(false);
            }
          },
        },
      ]
    );
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      const userData = await AsyncStorage.getItem("user");
      const parsedUser = JSON.parse(userData);
      const token = parsedUser.accessToken;

      const response = await axios.put(`${API_URL}/users/provider/profile`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setProvider(response.data.data);
        setEditing(false);
        Alert.alert("Success", "Profile updated successfully!");
      }
    } catch (error) {
      if (error.response?.data?.message) {
        Alert.alert("Error", error.response.data.message);
      } else {
        Alert.alert("Error", "Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setValue("username", provider.username || '');
    setValue("phoneNo", provider.phoneNo || '');
    setValue("shopAddress", provider.shopAddress || '');
    setEditing(false);
  };

  // Function to generate initials from username
  const getInitials = (name) => {
    if (!name) return "SP";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to generate a color based on username
  const getAvatarColor = (name) => {
    if (!name) return "#3B82F6";
    
    const colors = [
      "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", 
      "#EC4899", "#06B6D4", "#EF4444", "#84CC16"
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  if (error || !provider) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <MaterialIcons name="error-outline" size={50} color="#EF4444" />
        <Text style={styles.errorText}>
          {error || "No provider data available"}
        </Text>
      </SafeAreaView>
    );
  }

  const avatarColor = getAvatarColor(provider.username);
  const initials = getInitials(provider.username);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Header with gradient background */}
        <LinearGradient
          colors={['#8A63D2', '#A78BFA']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity 
                style={styles.avatarTouchable}
                onPress={pickImage}
                disabled={updatingPic}
              >
                {provider.profilePic ? (
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: provider.profilePic }} style={styles.avatar} />
                    <View style={styles.avatarBadge}>
                      <MaterialIcons name="camera-alt" size={16} color="#fff" />
                    </View>
                  </View>
                ) : (
                  <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                    <View style={styles.avatarBadge}>
                      <MaterialIcons name="camera-alt" size={16} color="#fff" />
                    </View>
                  </View>
                )}
                {updatingPic && (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={styles.businessName}>{provider.username}</Text>
              <Text style={styles.providerTitle}>Service Provider</Text>
            </View>

            <View style={styles.headerActions}>
              {!editing ? (
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => setEditing(true)}
                >
                  <MaterialIcons name="edit" size={20} color="#8A63D2" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.editActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={handleCancel}
                    disabled={saving}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleSubmit(handleSave)}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Profile Content */}
        <View style={styles.content}>
          {/* Contact Information Card */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Contact Information</Text>
            
            <View style={styles.infoItem}>
              <Ionicons name="mail-outline" size={22} color="#8A63D2" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{provider.email}</Text>
                <Text style={styles.fieldNote}>Email cannot be changed</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={22} color="#8A63D2" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                {editing ? (
                  <Controller
                    control={control}
                    name="phoneNo"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[styles.inputField, errors.phoneNo && styles.errorInput]}
                        value={value}
                        onChangeText={onChange}
                        placeholder="Enter phone number"
                        keyboardType="phone-pad"
                        returnKeyType="next"
                        blurOnSubmit={false}
                      />
                    )}
                  />
                ) : (
                  <Text style={styles.infoValue}>{provider.phoneNo || "Not provided"}</Text>
                )}
                {editing && errors.phoneNo && (
                  <Text style={styles.errorText}>{errors.phoneNo.message}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Business Information Card */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Business Information</Text>
            
            <View style={styles.infoItem}>
              <Ionicons name="business-outline" size={22} color="#8A63D2" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Business Name</Text>
                {editing ? (
                  <Controller
                    control={control}
                    name="username"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[styles.inputField, errors.username && styles.errorInput]}
                        value={value}
                        onChangeText={onChange}
                        placeholder="Enter business name"
                        returnKeyType="next"
                        blurOnSubmit={false}
                      />
                    )}
                  />
                ) : (
                  <Text style={styles.infoValue}>{provider.username}</Text>
                )}
                {editing && errors.username && (
                  <Text style={styles.errorText}>{errors.username.message}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={22} color="#8A63D2" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Shop Address</Text>
                {editing ? (
                  <Controller
                    control={control}
                    name="shopAddress"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[styles.inputField, styles.multilineInput, errors.shopAddress && styles.errorInput]}
                        value={value}
                        onChangeText={onChange}
                        placeholder="Enter shop address"
                        multiline
                        numberOfLines={3}
                        returnKeyType="done"
                        blurOnSubmit={true}
                      />
                    )}
                  />
                ) : (
                  <Text style={styles.infoValue}>{provider.shopAddress || "Not provided"}</Text>
                )}
                {editing && errors.shopAddress && (
                  <Text style={styles.errorText}>{errors.shopAddress.message}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Contact Information for Inquiry */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Contact & Support</Text>
            
            <View style={styles.infoItem}>
              <MaterialIcons name="email" size={22} color="#8A63D2" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>tailorwash@gmail.com</Text>
                <Text style={styles.fieldNote}>For inquiries and support</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.infoItem}>
              <MaterialIcons name="phone" size={22} color="#8A63D2" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>03160263282</Text>
                <Text style={styles.fieldNote}>Contact number for inquiries</Text>
              </View>
            </View>
          </View>

          {/* Services Offered Card */}
         
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  header: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  providerTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  headerActions: {
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    minWidth: 50,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A63D2',
  },
  content: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  inputField: {
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8A63D2',
    marginTop: 4,
  },
  errorInput: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  fieldNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  multilineInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  fieldNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  serviceTag: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    marginBottom: 10,
    minWidth: 120,
  },
  serviceText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  serviceDescription: {
    color: '#6B7280',
    fontSize: 12,
  },
  noServicesText: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statSeparator: {
    width: 1,
    backgroundColor: '#F3F4F6',
  },
});