import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL } from "../../baseURL";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const localIp = API_URL;

// *************** ZOD SCHEMA *****************
const serviceSchema = z.object({
  serviceName: z.string().min(1, "Service name is required"),
});

const ServicesScreen = () => {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // *************** REACT HOOK FORM *****************
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: { serviceName: "" },
  });

  // Fetch services
  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${localIp}/services/getAll`);
      setServices(response.data.data);
      setFilteredServices(response.data.data);
    } catch (error) {
("Error fetching services", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (searchText.trim() === "") {
      setFilteredServices(services);
    } else {
      setFilteredServices(
        services.filter((s) =>
          s.name.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
  }, [searchText, services]);

  const addService = async (data) => {
    try {
      setLoadingAction(true);
      const token = await AsyncStorage.getItem("user");
      const accessToken = token ? JSON.parse(token).accessToken : null;
      if (!accessToken) {
        router.push("/auth/login");
        return;
      }
      const response = await axios.post(
        `${localIp}/services/createservice`,
        { name: data.serviceName },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setServices((prev) => [...prev, response.data.data]);
      reset(); // Reset the form
      setConfirmVisible(false);
      setSuccessMessage("Service added successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
("Error adding service", error);
      Alert.alert("Error", "Failed to add service");
    } finally {
      setLoadingAction(false);
    }
  };

  const updateService = async (data) => {
    try {
      setLoadingAction(true);
      const token = await AsyncStorage.getItem("user");
      const accessToken = token ? JSON.parse(token).accessToken : null;
      if (!accessToken) {
        router.push("/auth/login");
        return;
      }
      const response = await axios.put(
        `${localIp}/services/updateservice/${selectedService._id}`,
        { name: data.serviceName },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setServices((prev) =>
        prev.map((s) => (s._id === selectedService._id ? response.data.data : s))
      );
      setEditVisible(false);
      setSuccessMessage("Service updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
("Error updating service", error);
      Alert.alert("Error", "Failed to update service");
    } finally {
      setLoadingAction(false);
    }
  };

  const deleteService = async () => {
    try {
      setLoadingAction(true);
      const token = await AsyncStorage.getItem("user");
      const accessToken = token ? JSON.parse(token).accessToken : null;
      if (!accessToken) {
        router.push("/auth/login");
        return;
      }
      await axios.delete(`${localIp}/services/delete/${serviceToDelete._id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setServices((prev) => prev.filter((s) => s._id !== serviceToDelete._id));
      setDeleteConfirmVisible(false);
      setServiceToDelete(null);
      setSuccessMessage("Service deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
("Error deleting service", error);
      Alert.alert("Error", "Failed to delete service");
    } finally {
      setLoadingAction(false);
    }
  };

  const confirmDeleteService = (service) => {
    setServiceToDelete(service);
    setDeleteConfirmVisible(true);
  };

  // Convert to snake case for display
  const toSnakeCase = (str) => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
      .replace(/[^a-zA-Z0-9 ]/g, ' ') // Replace special characters with space
      .split(' ') // Split into words
      .filter(word => word.length > 0) // Remove empty strings
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter
      .join(' '); // Join with spaces
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        {/* Service Name Input */}
        <Controller
          control={control}
          name="serviceName"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Service Name"
              value={value}
              onChangeText={onChange}
              style={styles.input}
            />
          )}
        />
        {errors.serviceName && (
          <Text style={styles.errorText}>{errors.serviceName.message}</Text>
        )}

        {/* Add Service Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit(() => setConfirmVisible(true))}
          disabled={loadingAction}
        >
          {loadingAction ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Add Service</Text>
          )}
        </TouchableOpacity>

        {/* Search Input */}
        <TextInput
          placeholder="Search Services"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.input}
        />

        {loading ? (
          <ActivityIndicator size="large" style={{ marginVertical: 20 }} />
        ) : (
          <FlatList
            data={filteredServices}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{toSnakeCase(item.name || "")}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedService(item);
                      setValue("serviceName", item.name);
                      setEditVisible(true);
                    }}
                    disabled={loadingAction}
                  >
                    <Text style={styles.actionText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => confirmDeleteService(item)}
                    disabled={loadingAction}
                  >
                    <Text style={[styles.actionText, { color: "red" }]}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 50 }}
          />
        )}
      </View>

      {/* Add Modal */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Service?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setConfirmVisible(false)}
                disabled={loadingAction}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonOk}
                onPress={handleSubmit(addService)}
                disabled={loadingAction}
              >
                {loadingAction ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff" }}>Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Service</Text>
            <Controller
              control={control}
              name="serviceName"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  style={styles.input}
                  placeholder="Service Name"
                />
              )}
            />
            {errors.serviceName && (
              <Text style={styles.errorText}>{errors.serviceName.message}</Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setEditVisible(false)}
                disabled={loadingAction}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonOk}
                onPress={handleSubmit(updateService)}
                disabled={loadingAction}
              >
                {loadingAction ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff" }}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteConfirmVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Delete Service?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{serviceToDelete ? toSnakeCase(serviceToDelete.name || "") : ''}"? This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setDeleteConfirmVisible(false);
                  setServiceToDelete(null);
                }}
                disabled={loadingAction}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonOk, { backgroundColor: "#dc3545" }]}
                onPress={deleteService}
                disabled={loadingAction}
              >
                {loadingAction ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff" }}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {successMessage !== "" && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  errorText: { color: "red", marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    marginVertical: 5,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "bold" },
  cardActions: { flexDirection: "row", gap: 10 },
  actionText: { fontSize: 18, marginHorizontal: 8 },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    width: "80%",
    borderRadius: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalMessage: { fontSize: 16, color: "#666", marginBottom: 15, textAlign: "center" },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  modalButtonCancel: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginRight: 10,
  },
  modalButtonOk: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  cancelText: { color: "black" },
  successContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  successText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default ServicesScreen;