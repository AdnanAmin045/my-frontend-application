import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import { API_URL } from "../baseURL";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function ProviderProfile() {
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        const response = await axios.get(`${API_URL}/providers/getProfile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.data.success) {
          setProvider(response.data.data);
        } else {
          setError(response.data.message || "Failed to load profile");
        }
        setError(null);
      } catch (error) {
        console.log("Error fetching provider profile:", error);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProviderProfile();
  }, []);

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with gradient background */}
        <LinearGradient
          colors={['#3B82F6', '#2563EB']}
          style={styles.header}
        >
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.businessName}>{provider.username}</Text>
          <Text style={styles.providerTitle}>Service Provider</Text>
        </LinearGradient>

        {/* Profile Content */}
        <View style={styles.content}>
          {/* Contact Information Card */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Contact Information</Text>
            
            <View style={styles.infoItem}>
              <Ionicons name="mail-outline" size={22} color="#3B82F6" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{provider.email}</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={22} color="#3B82F6" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{provider.phoneNo || "Not provided"}</Text>
              </View>
            </View>
          </View>

          {/* Address Card */}
          {provider.shopAddress && (
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Shop Address</Text>
              
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={22} color="#3B82F6" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>{provider.shopAddress}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Services Offered Card */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Services Offered</Text>
            
            <View style={styles.servicesContainer}>
              {provider.servicesOffered && provider.servicesOffered.length > 0 ? (
                provider.servicesOffered.map((service, index) => (
                  <View key={index} style={styles.serviceTag}>
                    <Text style={styles.serviceText}>
                      {service.name || service}
                    </Text>
                    {service.description && (
                      <Text style={styles.serviceDescription}>
                        {service.description}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noServicesText}>No services listed yet</Text>
              )}
            </View>
          </View>
         
        </View>
      </ScrollView>
    </SafeAreaView>
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
    height: 200,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
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
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  businessName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  providerTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
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