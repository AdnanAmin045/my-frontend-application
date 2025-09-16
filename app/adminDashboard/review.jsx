import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import { API_URL } from "../../baseURL";

const ServiceProvidersList = () => {
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchProviders();
  }, []);

  // Filter providers based on search text
  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredProviders(providers);
    } else {
      const filtered = providers.filter(provider =>
        provider.username.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredProviders(filtered);
    }
  }, [searchText, providers]);

  // --- API Calls inside the component ---
  const getToken = async () => {
    const user = await AsyncStorage.getItem("user");
    return user ? JSON.parse(user).accessToken : null;
  };

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.get(`${API_URL}/feedback/getProviderForFeedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const providersData = response.data.providers || response.data || [];
      setProviders(providersData);
      setFilteredProviders(providersData);
    } catch (err) {
      console.error(err);
      alert("Failed to load service providers");
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderReviews = async (providerId) => {
    try {
      setReviewsLoading(true);
      const token = await getToken();
      const response = await axios.get(
        `${API_URL}/feedback/${providerId}/reviews`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviews(response.data.reviews || response.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load reviews");
    } finally {
      setReviewsLoading(false);
    }
  };

  const openReviewsModal = async (provider) => {
    setSelectedProvider(provider);
    setReviewsModalVisible(true);
    await fetchProviderReviews(provider._id);
  };

  // --- Professional Star Rating Rendering ---
  const renderStars = (rating) => {
    const stars = [];
    const filledStars = Math.floor(rating);
    const hasHalfStar = rating - filledStars >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= filledStars) {
        stars.push(<Icon key={i} name="star" size={18} color="#FFD700" />);
      } else if (i === filledStars + 1 && hasHalfStar) {
        stars.push(<Icon key={i} name="star-half-full" size={18} color="#FFD700" />);
      } else {
        stars.push(<Icon key={i} name="star-outline" size={18} color="#FFD700" />);
      }
    }

    return <View style={styles.starsRow}>{stars}</View>;
  };

  const renderProviderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.profilePic ? (
          <Image source={{ uri: item.profilePic }} style={styles.profileImage} />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Icon name="account" size={30} color="#6200ea" />
          </View>
        )}
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{item.username}</Text>
          <Text style={styles.providerContact}>{item.phoneNo}</Text>
          <Text style={styles.providerEmail}>{item.email}</Text>
          <Text style={styles.providerAddress}>{item.shopAddress}</Text>
          <View style={styles.ratingContainer}>
            {renderStars(item.rating || 0)}
            <Text style={styles.ratingText}>({item.rating?.toFixed(1) || 0})</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.reviewButton} 
        onPress={() => openReviewsModal(item)}
      >
        <Icon name="message-text" size={20} color="#fff" />
        <Text style={styles.buttonText}>View Reviews</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color="#6200ea"
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Service Providers</Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username..."
          value={searchText}
          onChangeText={setSearchText}
          clearButtonMode="while-editing"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Icon name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredProviders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={renderProviderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-search" size={50} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchText ? `No providers found for "${searchText}"` : "No service providers found"}
            </Text>
          </View>
        }
      />

      {/* Reviews Modal */}
      <Modal visible={reviewsModalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Reviews for {selectedProvider?.username}
            </Text>

            {reviewsLoading ? (
              <ActivityIndicator size="large" color="#6200ea" />
            ) : reviews.length === 0 ? (
              <Text style={styles.emptyText}>No reviews yet</Text>
            ) : (
              <ScrollView>
                {reviews.map((review, index) => (
                  <View key={index} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewUser}>
                        {review.givenBy?.username || "Unknown"}
                      </Text>
                      {renderStars(review.rating)}
                    </View>
                    {review.comment && (
                      <Text style={styles.reviewComment}>"{review.comment}"</Text>
                    )}
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setReviewsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlign: "center", color: "#333" },
  
  // Search bar styles
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  cardHeader: { flexDirection: "row", marginBottom: 12 },
  profileImage: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  providerInfo: { flex: 1 },
  providerName: { fontWeight: "bold", fontSize: 18, marginBottom: 4 },
  providerContact: { fontSize: 14, color: "#555", marginBottom: 2 },
  providerEmail: { fontSize: 14, color: "#555", marginBottom: 2 },
  providerAddress: { fontSize: 14, color: "#555", marginBottom: 4, fontStyle: "italic" },
  ratingContainer: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  starsRow: { flexDirection: "row" },
  ratingText: { marginLeft: 6, fontWeight: "bold", color: "#555" },
  reviewButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "#03a9f4", 
    padding: 10, 
    borderRadius: 6 
  },
  buttonText: { color: "#fff", marginLeft: 6, fontWeight: "bold" },
  modalBackground: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  modalContainer: { 
    width: "90%", 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    padding: 20, 
    maxHeight: "80%" 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 16, 
    textAlign: "center" 
  },
  reviewCard: { 
    backgroundColor: "#f9f9f9", 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 10 
  },
  reviewHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 8 
  },
  reviewUser: { 
    fontWeight: "bold", 
    fontSize: 14 
  },
  reviewComment: { 
    fontSize: 14, 
    marginBottom: 8, 
    fontStyle: "italic" 
  },
  reviewDate: { 
    fontSize: 12, 
    color: "#888", 
    textAlign: "right" 
  },
  closeButton: { 
    backgroundColor: "#6200ea", 
    padding: 12, 
    borderRadius: 8, 
    marginTop: 16 
  },
  closeButtonText: { 
    color: "#fff", 
    textAlign: "center", 
    fontWeight: "bold" 
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: { 
    textAlign: "center", 
    color: "#888", 
    fontSize: 16, 
    marginTop: 10 
  },
});

export default ServiceProvidersList;