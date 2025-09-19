import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { API_URL } from "../../baseURL";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Urdu labels mapping
const measurementLabels = {
  chest: "Chest / سینہ",
  waist: "Waist / کمر",
  hips: "Hips / کولہے",
  shoulder: "Shoulder / کندھا",
  sleeveLength: "Sleeve Length / آستین کی لمبائی",
  shirtLength: "Shirt Length / قمیض کی لمبائی",
  trouserLength: "Trouser Length / پتلون کی لمبائی",
  inseam: "Inseam / اندرونی سیون",
  neck: "Neck / گردن",
  notes: "Notes / نوٹس"
};

const MeasurementDisplay = () => {
  const route = useRouter()
  const [measurements, setMeasurements] = useState([]);
  const [filteredMeasurements, setFilteredMeasurements] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMeasurements();
  }, []);

  useEffect(() => {
    const filtered = measurements.filter((item) =>
      item.serviceProvider.username
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
    setFilteredMeasurements(filtered);
  }, [searchTerm, measurements]);

  const fetchMeasurements = async () => {
    try {
      setLoading(true);
      const user = await AsyncStorage.getItem("user");
      const token = user ? JSON.parse(user).accessToken : null;
      const response = await axios.get(`${API_URL}/measurements/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setMeasurements(response.data.data);
        setFilteredMeasurements(response.data.data);
      } else {
        setError("Failed to fetch measurements");
        Alert.alert("Error", "Failed to fetch measurements");
      }
    } catch (err) {
      setError("Error connecting to server");
      Alert.alert("Error", "Could not connect to server");
("Error fetching measurements:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
  };

  const handleBackToList = () => {
    setSelectedProvider(null);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading measurements...</Text>
        </View>
      </View>
    );
  }

  if (error && measurements.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={fetchMeasurements}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.header}>My Measurements</Text>

        {!selectedProvider ? (
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search service providers..."
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>

            {filteredMeasurements.length === 0 ? (
              <View style={styles.centerContent}>
                <Text style={styles.noResultsText}>
                  {searchTerm
                    ? `No service providers found matching "${searchTerm}"`
                    : "No measurements found. Please add measurements first."}
                </Text>
              </View>
            ) : (
              <View style={styles.providersList}>
                {filteredMeasurements.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.providerCard}
                    onPress={() => handleProviderSelect(item)}
                  >
                    <View style={styles.providerInfo}>
                      <Text style={styles.providerName}>
                        {item.serviceProvider.username}
                      </Text>
                      <Text style={styles.providerDetail}>
                        {item.serviceProvider.email}
                      </Text>
                      <Text style={styles.providerDetail}>
                        {item.serviceProvider.phone}
                      </Text>
                    </View>
                    <View style={styles.viewDetailsButton}>
                      <Text style={styles.viewDetailsButtonText}>
                        View Measurements
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.measurementDetails}>
            <TouchableOpacity
              onPress={handleBackToList}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>&larr; Back to List</Text>
            </TouchableOpacity>

            <View style={styles.providerHeader}>
              <Text style={styles.providerTitle}>
                {selectedProvider.serviceProvider.username}'s Measurements
              </Text>
              <View style={styles.providerContact}>
                <Text style={styles.contactDetail}>
                  <Text style={styles.contactLabel}>Email:</Text>{" "}
                  {selectedProvider.serviceProvider.email}
                </Text>
                <Text style={styles.contactDetail}>
                  <Text style={styles.contactLabel}>Phone:</Text>{" "}
                  {selectedProvider.serviceProvider.phone}
                </Text>
                <Text style={styles.contactDetail}>
                  <Text style={styles.contactLabel}>Address:</Text>{" "}
                  {selectedProvider.serviceProvider.address}
                </Text>
              </View>
            </View>

            <View style={styles.measurementsGrid}>
              <View style={styles.measurementRow}>
                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>{measurementLabels.chest}</Text>
                  <Text style={styles.measurementValue}>
                    {selectedProvider.measurements.chest || "Not provided / دستیاب نہیں"} inches
                  </Text>
                </View>

                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>{measurementLabels.waist}</Text>
                  <Text style={styles.measurementValue}>
                    {selectedProvider.measurements.waist || "Not provided / دستیاب نہیں"} inches
                  </Text>
                </View>
              </View>

              <View style={styles.measurementRow}>
                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>{measurementLabels.hips}</Text>
                  <Text style={styles.measurementValue}>
                    {selectedProvider.measurements.hips || "Not provided / دستیاب نہیں"} inches
                  </Text>
                </View>

                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>{measurementLabels.shoulder}</Text>
                  <Text style={styles.measurementValue}>
                    {selectedProvider.measurements.shoulder || "Not provided / دستیاب نہیں"}{" "}
                    inches
                  </Text>
                </View>
              </View>

              <View style={styles.measurementRow}>
                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>{measurementLabels.sleeveLength}</Text>
                  <Text style={styles.measurementValue}>
                    {selectedProvider.measurements.sleeveLength ||
                      "Not provided / دستیاب نہیں"}{" "}
                    inches
                  </Text>
                </View>

                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>{measurementLabels.shirtLength}</Text>
                  <Text style={styles.measurementValue}>
                    {selectedProvider.measurements.shirtLength ||
                      "Not provided / دستیاب نہیں"}{" "}
                    inches
                  </Text>
                </View>
              </View>

              <View style={styles.measurementRow}>
                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>{measurementLabels.trouserLength}</Text>
                  <Text style={styles.measurementValue}>
                    {selectedProvider.measurements.trouserLength ||
                      "Not provided / دستیاب نہیں"}{" "}
                    inches
                  </Text>
                </View>

                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>{measurementLabels.inseam}</Text>
                  <Text style={styles.measurementValue}>
                    {selectedProvider.measurements.inseam || "Not provided / دستیاب نہیں"} inches
                  </Text>
                </View>
              </View>

              <View style={styles.measurementRow}>
                <View style={[styles.measurementItem, styles.fullWidthItem]}>
                  <Text style={styles.measurementLabel}>{measurementLabels.neck}</Text>
                  <Text style={styles.measurementValue}>
                    {selectedProvider.measurements.neck || "Not provided / دستیاب نہیں"} inches
                  </Text>
                </View>
              </View>
            </View>

            {selectedProvider.measurements.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesTitle}>Additional Notes / اضافی نوٹس</Text>
                <Text style={styles.notesText}>
                  {selectedProvider.measurements.notes}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    marginTop:20
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2c3e50",
    margin: 16,
    marginBottom: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#7f8c8d",
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#3498db",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "500",
  },
  searchContainer: {
    padding: 16,
    paddingTop: 8,
  },
  searchInput: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  noResultsText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: 20,
  },
  providersList: {
    padding: 16,
    paddingTop: 0,
  },
  providerCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerInfo: {
    marginBottom: 12,
  },
  providerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  providerDetail: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 2,
  },
  viewDetailsButton: {
    backgroundColor: "#3498db",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  viewDetailsButtonText: {
    color: "white",
    fontWeight: "500",
  },
  measurementDetails: {
    padding: 16,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: "#3498db",
    fontSize: 16,
  },
  providerHeader: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  providerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  providerContact: {
    marginBottom: 5,
  },
  contactDetail: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  contactLabel: {
    fontWeight: "600",
  },
  measurementsGrid: {
    marginBottom: 20,
  },
  measurementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  measurementItem: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
    flex: 1,
    marginHorizontal: 6,
  },
  fullWidthItem: {
    marginHorizontal: 0,
  },
  measurementLabel: {
    fontWeight: "600",
    color: "#2c3e50",
    fontSize: 14,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  measurementValue: {
    fontSize: 18,
    color: "#2c3e50",
  },
  notesSection: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 10,
  },
  notesText: {
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
  },
  measurementMeta: {
    alignItems: "flex-end",
  },
  metaText: {
    color: "#7f8c8d",
    fontSize: 14,
  },
});

export default MeasurementDisplay;
