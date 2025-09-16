import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

const DashboardScreen = () => {
  // Dummy user data
  const userData = {
    name: "Johnathan Doe",
    email: "john.doe@example.com",
    cnic: "42201-1234567-8",
    profileImage: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    phone: "03245654545",
    location: "DHA, Lahore"
  };

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileContainer}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: userData.profileImage }}
            style={styles.profileImage}
          />
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={16} color="white" />
          </View>
        </View>
        
        <Text style={styles.userName}>{userData.name}</Text>        
        <View style={styles.userDetails}>
          <View style={styles.detailItem}>
            <MaterialIcons name="email" size={20} color="#6200ee" />
            <Text style={styles.detailText}>{userData.email}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <FontAwesome5 name="id-card" size={18} color="#6200ee" />
            <Text style={styles.detailText}>{userData.cnic}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <MaterialIcons name="phone" size={20} color="#6200ee" />
            <Text style={styles.detailText}>{userData.phone}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <MaterialIcons name="location-on" size={20} color="#6200ee" />
            <Text style={styles.detailText}>{userData.location}</Text>
          </View>
        </View>
      </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  profileContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#6200ee",
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: '500',
    marginBottom: 20,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userDetails: {
    width: '100%',
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailText: {
    fontSize: 16,
    color: "#555",
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '48%',
  },
  editButton: {
    backgroundColor: '#6200ee',
  },
  settingsButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#6200ee',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  settingsButtonText: {
    color: '#6200ee',
  },
});

export default DashboardScreen;