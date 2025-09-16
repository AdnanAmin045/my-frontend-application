import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { API_URL } from "../../baseURL";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Fetch Applications
  const fetchApplications = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem("user");
      const accessToken = token ? JSON.parse(token).accessToken : null;
      if (!accessToken) {
        router.push("/auth/login");
        return;
      }
      const response = await axios.get(`${API_URL}/applications/getAll`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.status === 200) {
        setApplications(response.data.data || []);
      } else {
        Alert.alert("Error", "Failed to fetch applications");
      }
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.message || error.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Update Approval Status
  const updateApproval = async (id, newStatus) => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("user");
      const accessToken = token ? JSON.parse(token).accessToken : null;
      if (!accessToken) {
        router.push("/auth/login");
        return;
      }

      const response = await axios.patch(
        `${API_URL}/applications/update/${id}`,
        { approvalFromAdmin: newStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.status === 200) {
        setApplications((prev) =>
          prev.map((app) =>
            app._id === id ? { ...app, approvalFromAdmin: newStatus } : app
          )
        );
        setModalMessage(
          `Application ${newStatus ? "Approved" : "Rejected"} successfully!`
        );
        setModalVisible(true);
      } else {
        Alert.alert("Error", "Failed to update status");
      }
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search
  const filteredApplications = applications.filter((app) => {
    const matchesSearch = app.username
      .toLowerCase()
      .includes(searchText.toLowerCase());

    let matchesFilter = true;
    if (filterStatus === "Approved")
      matchesFilter = app.approvalFromAdmin === true;
    else if (filterStatus === "Pending")
      matchesFilter =
        app.approvalFromAdmin === false ||
        app.approvalFromAdmin === null ||
        app.approvalFromAdmin === undefined;

    return matchesSearch && matchesFilter;
  });

  // Get status text and color
  const getStatusInfo = (approvalStatus) => {
    if (approvalStatus === true) {
      return { text: "Approved", color: "#4CAF50" };
    } else if (
      approvalStatus === false ||
      approvalStatus === null ||
      approvalStatus === undefined
    ) {
      return { text: "Pending", color: "#FF9800" };
    }
    return { text: "Unknown", color: "#9E9E9E" };
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchApplications} />
      }
    >
      <View style={styles.headerContainer}>
        <Text style={styles.header}>All Applications</Text>
        <Text style={styles.subHeader}>
          Review and manage service provider applications
        </Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          placeholder="Search by username"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.filterContainer}>
        {["All", "Approved", "Pending"].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.activeFilterButton,
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterStatus === status && styles.activeFilterButtonText,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />

      {filteredApplications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-done-circle" size={64} color="#e0e0e0" />
          <Text style={styles.emptyStateText}>No applications found</Text>
          <Text style={styles.emptyStateSubText}>
            Try adjusting your search or filter
          </Text>
        </View>
      ) : (
        filteredApplications.map((app) => {
          const statusInfo = getStatusInfo(app.approvalFromAdmin);

          return (
            <View key={app._id} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.profileContainer}>
                  <Image
                    source={{
                      uri:
                        app.profilePic ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                    }}
                    style={styles.profilePic}
                  />
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.headerRow}>
                    <Text style={styles.username}>{app.username}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusInfo.color },
                      ]}
                    >
                      <Text style={styles.statusText}>{statusInfo.text}</Text>
                    </View>
                  </View>

                  <View style={styles.contactInfo}>
                    <Ionicons name="mail" size={14} color="#666" />
                    <Text style={styles.details}>{app.email}</Text>
                  </View>

                  <View style={styles.contactInfo}>
                    <Ionicons name="call" size={14} color="#666" />
                    <Text style={styles.details}>{app.phoneNo}</Text>
                  </View>

                  <View style={styles.contactInfo}>
                    <Ionicons name="business" size={14} color="#666" />
                    <Text style={styles.details} numberOfLines={1}>
                      {app.shopAddress}
                    </Text>
                  </View>

                  {/* Display Services */}
                  {app.serviceNames && app.serviceNames.length > 0 && (
                    <View style={styles.servicesContainer}>
                      <Text style={styles.servicesLabel}>Services:</Text>
                      <View style={styles.servicesList}>
                        {app.serviceNames.map((service, index) => (
                          <View key={index} style={styles.serviceChip}>
                            <Text style={styles.serviceText}>{service}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.buttonContainer}>
                    {app.approvalFromAdmin ? (
                      <TouchableOpacity
                        style={[styles.button, styles.rejectButton]}
                        onPress={() => updateApproval(app._id, false)}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Ionicons name="close" size={16} color="#fff" />
                            <Text style={styles.buttonText}>Reject</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.button, styles.approveButton]}
                        onPress={() => updateApproval(app._id, true)}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Ionicons name="checkmark" size={16} color="#fff" />
                            <Text style={styles.buttonText}>Approve</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        })
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                <Text style={styles.modalText}>{modalMessage}</Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}

// Professional Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  headerContainer: {
    marginBottom: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 4,
  },
  subHeader: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#95a5a6",
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#bdc3c7",
    marginTop: 4,
  },
  card: {
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
  },
  profileContainer: {
    position: "relative",
    marginRight: 16,
  },
  profilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  detailsContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  servicesContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  servicesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 6,
  },
  servicesList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  serviceChip: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 6,
  },
  serviceText: {
    fontSize: 12,
    color: "#388e3c",
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: "#4CAF50",
    marginRight: 8,
  },
  rejectButton: {
    backgroundColor: "#f44336",
    marginLeft: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 16,
    color: "#2c3e50",
  },
  modalButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  activeFilterButton: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  filterButtonText: {
    fontSize: 12,
    color: "#666",
  },
  activeFilterButtonText: {
    color: "#fff",
  },
});
