import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Alert,
  TextInput
} from "react-native";
import axios from "axios";
import { API_URL } from "../../baseURL";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ProfileUploadService } from '../../utils/profileUpload';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingPic, setUpdatingPic] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  
  // Initialize profile upload service
  const profileUploadService = new ProfileUploadService();

  useEffect(() => {
    const fetchUserProfile = async () => {
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

        const response = await axios.get(`${API_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });     
        setUser(response.data.data);
        setUsername(response.data.data.username);
        setError(null);
      } catch (error) {
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
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
        'customer',
        // Success callback
        (data) => {
          setUser(data);
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


  const updateUsername = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Username cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const userData = await AsyncStorage.getItem("user");
      const parsedUser = JSON.parse(userData);
      const token = parsedUser.accessToken;

      const response = await axios.put(`${API_URL}/users/updateInfo`, {
        username: username.trim()
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        setUser(response.data.data);
        setEditing(false);
        Alert.alert("Success", "Username updated successfully!");
      }
    } catch (error) {
      if (error.response?.data?.message) {
        Alert.alert("Error", error.response.data.message);
      } else {
        Alert.alert("Error", "Failed to update username");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setUsername(user.username);
    setEditing(false);
  };

  // Function to generate initials from username
  const getInitials = (name) => {
    if (!name) return "US";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to generate a color based on username
  const getAvatarColor = (name) => {
    if (!name) return "#4A90E2";
    
    const colors = [
      "#4A90E2", "#50C878", "#FF6B6B", "#9B59B6", 
      "#E67E22", "#2ECC71", "#E74C3C", "#16A085"
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="error-outline" size={50} color="#FF6B6B" />
        <Text style={styles.errorText}>
          {error || "No user data available"}
        </Text>
      </View>
    );
  }

  const avatarColor = getAvatarColor(user.username);
  const initials = getInitials(user.username);

  return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with gradient background */}
        <LinearGradient
          colors={['#4A90E2', '#357ABD']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity 
                style={styles.avatarTouchable}
                onPress={pickImage}
                disabled={updatingPic}
              >
                {user.profilePic ? (
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: user.profilePic }} style={styles.avatar} />
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
              <Text style={styles.username}>{user.username}</Text>
              <Text style={styles.userTitle}>User Profile</Text>
            </View>

            <View style={styles.headerActions}>
              {!editing ? (
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => setEditing(true)}
                >
                  <MaterialIcons name="edit" size={20} color="#4A90E2" />
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
                    onPress={updateUsername}
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
          <View style={styles.userInfo}>
            <Text style={styles.email}>{user.email}</Text>
          </View>
          
          {/* Profile Information Card */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Profile Information</Text>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <MaterialIcons name="person" size={24} color="#4A90E2" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Username</Text>
                {editing ? (
                  <TextInput
                    style={styles.inputField}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter username"
                  />
                ) : (
                  <Text style={styles.infoValue}>{user.username}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <MaterialIcons name="email" size={24} color="#4A90E2" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
                <Text style={styles.fieldNote}>Email cannot be changed</Text>
              </View>
            </View>           
          </View>

          {/* Contact Information for Inquiry */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Contact & Support</Text>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <MaterialIcons name="email" size={24} color="#4A90E2" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>tailorwash@gmail.com</Text>
                <Text style={styles.fieldNote}>For inquiries and support</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <MaterialIcons name="phone" size={24} color="#4A90E2" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>03160263282</Text>
                <Text style={styles.fieldNote}>Contact number for inquiries</Text>
              </View>
            </View>
          </View>

         
        </View>
      </ScrollView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
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
    color: '#555',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF6B6B',
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
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTouchable: {
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
  uploadingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  userTitle: {
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
    color: '#4A90E2',
  },
  avatarActions: {
    flexDirection: 'row',
    marginTop: 60,
    gap: 12,
    paddingHorizontal: 20,
  },
  profilePicContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  profilePicTouchable: {
    position: 'relative',
  },
  profilePicWrapper: {
    position: 'relative',
  },
  profilePicImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  defaultProfilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  profilePicBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4A90E2',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  content: {
    marginTop: 20,
    padding: 20,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 0,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  verifiedText: {
    color: '#2ECC71',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  inputField: {
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
    marginTop: 4,
  },
  fieldNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  statsPercentage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});