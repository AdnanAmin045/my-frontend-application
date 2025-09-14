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
  ScrollView,
} from "react-native";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { API_URL } from "../baseURL";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MeasurementsViewer = () => {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSP, setSelectedSP] = useState("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);

  const fetchMeasurements = async () => {
    try {
      setLoading(true);
      const user = await AsyncStorage.getItem("user");
      const token = user ? JSON.parse(user).accessToken : null;
      const response = await axios.get(`${API_URL}/measurements/get`,{
        headers: { Authorization: `Bearer ${token}` },
      });
      // response format: [{chest, waist,..., serviceProvider:{username,phoneNo,shopAddress,...}}, ...]
      setMeasurements(response.data.measurements || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch measurements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeasurements();
  }, []);

  const uniqueSPs = [...new Set(measurements.map((m) => m.serviceProvider?.username))];

  const filteredMeasurements =
    selectedSP === "all"
      ? measurements
      : measurements.filter((m) => m.serviceProvider?.username === selectedSP);

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Service Provider Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Shop Name:</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedSP} onValueChange={(value) => setSelectedSP(value)}>
            <Picker.Item label="All" value="all" />
            {uniqueSPs.map((username) => (
              <Picker.Item key={username} label={username} value={username} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Measurements List */}
      <FlatList
        data={filteredMeasurements}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              setSelectedMeasurement(item);
              setModalVisible(true);
            }}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.spName}>{item.serviceProvider?.username || "Unknown"}</Text>
              <Text style={styles.date}>
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
              </Text>
            </View>
            <View style={styles.measureRow}>
              <Text>Chest: {item.chest}</Text>
              <Text>Waist: {item.waist}</Text>
              <Text>Hips: {item.hips}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Modal for full details */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {selectedMeasurement?.serviceProvider?.username}'s Measurements
            </Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {selectedMeasurement &&
                Object.entries(selectedMeasurement)
                  .filter(
                    ([key]) =>
                      key !== "serviceProvider" && key !== "_id" && key !== "__v"
                  )
                  .map(([key, value]) => (
                    <View key={key} style={styles.measureRow}>
                      <Text style={styles.measureKey}>{key}:</Text>
                      <Text style={styles.measureValue}>{value}</Text>
                    </View>
                  ))}

              {/* Service Provider Info */}
              {selectedMeasurement?.serviceProvider && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontWeight: "700", marginBottom: 4 }}>Shop Info:</Text>
                  <Text>Phone: {selectedMeasurement.serviceProvider.phoneNo}</Text>
                  <Text>Address: {selectedMeasurement.serviceProvider.shopAddress}</Text>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Icon name="close-circle" size={24} color="#fff" />
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MeasurementsViewer;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 12 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  filterContainer: { marginBottom: 12 },
  filterLabel: { fontWeight: "600", marginBottom: 4, fontSize: 16 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  spName: { fontWeight: "700", fontSize: 16, color: "#1f2937" },
  date: { fontSize: 12, color: "#6b7280" },
  measureRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  measureKey: { fontWeight: "600", flex: 1 },
  measureValue: { flex: 1, textAlign: "right" },
  closeButton: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#dc3545",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  closeText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
});
