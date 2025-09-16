import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { API_URL } from "../../baseURL";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Zod schema for validation
const riderSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  CNIC: z
    .string()
    .regex(/^\d{5}-\d{7}-\d{1}$/, "CNIC must be in format 12345-1234567-1"),
  phoneNo: z.string().regex(/^\d{11}$/, "Phone number must be 11 digits"),
});

const RiderManagement = () => {
  const [riders, setRiders] = useState([]);
  const [filteredRiders, setFilteredRiders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRider, setEditingRider] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(riderSchema),
  });

  useEffect(() => {
    fetchRiders();
  }, []);

  useEffect(() => {
    handleSearch(searchQuery);
  }, [riders, searchQuery]);

  const fetchRiders = async () => {
    try {
      setIsLoading(true);
      const user = await AsyncStorage.getItem("user");
      const token = user ? JSON.parse(user).accessToken : null;
      const response = await axios.get(`${API_URL}/riders/getByProvider`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRiders(response.data.data);
    } catch (err) {
      setError("Failed to fetch riders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredRiders(riders);
    } else {
      const filtered = riders.filter((r) =>
        r.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredRiders(filtered);
    }
  };

  const openModal = (rider = null) => {
    if (rider) {
      setEditingRider(rider);
      setValue("name", rider.name);
      setValue("CNIC", rider.CNIC);
      setValue("phoneNo", rider.phoneNo);
    } else {
      setEditingRider(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRider(null);
    reset();
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError("");

    try {
      const user = await AsyncStorage.getItem("user");
      const token = user ? JSON.parse(user).accessToken : null;
      if (!token) throw new Error("Authentication token not found");

      const config = { headers: { Authorization: `Bearer ${token}` } };
      let response;

      if (editingRider) {
        response = await axios.put(
          `${API_URL}/riders/update/${editingRider._id}`,
          data,
          config
        );
      } else {
        response = await axios.post(`${API_URL}/riders/create`, data, config);
      }

      closeModal();
      fetchRiders();
      Alert.alert("Success", response.data.message || "Operation successful");
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Operation failed";
      setError(msg);
      Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRider = async (id) => {
    Alert.alert("Confirm", "Are you sure you want to delete this rider?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLoading(true);
            const user = await AsyncStorage.getItem("user");
            const token = user ? JSON.parse(user).accessToken : null;
            if (!token) throw new Error("Authentication token not found");
            await axios.delete(`${API_URL}/riders/delete/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setError(null)
            fetchRiders();
          } catch (err) {
            setError("Failed to delete rider");
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const renderRider = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={styles.cell}>{item.name}</Text>
      <Text style={styles.cell}>{item.CNIC}</Text>
      <Text style={styles.cell}>{item.phoneNo}</Text>
      <View style={styles.cellActions}>
        <TouchableOpacity
          style={[styles.btn, styles.btnEdit]}
          onPress={() => openModal(item)}
        >
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnDelete]}
          onPress={() => deleteRider(item._id)}
        >
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Riders</Text>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => openModal()}
        >
          <Text style={styles.btnText}>Add New Rider</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by Name..."
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {error ? <Text style={styles.errorMessage}>{error}</Text> : null}

      {isLoading ? (
        <ActivityIndicator size="large" color="#4caf50" />
      ) : (
        <ScrollView horizontal>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              {["Name", "CNIC", "Phone", "Actions"].map((head) => (
                <Text style={[styles.cell, styles.headerCell]} key={head}>
                  {head}
                </Text>
              ))}
            </View>
            <FlatList
              data={filteredRiders}
              renderItem={renderRider}
              keyExtractor={(item) => item._id}
            />
          </View>
        </ScrollView>
      )}

      <Modal visible={isModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editingRider ? "Edit Rider" : "Add New Rider"}
            </Text>
            <ScrollView>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                      style={[styles.input, errors.name && styles.errorInput]}
                      value={value}
                      onChangeText={onChange}
                    />
                    {errors.name && (
                      <Text style={styles.errorText}>
                        {errors.name.message}
                      </Text>
                    )}
                  </View>
                )}
              />
              <Controller
                control={control}
                name="CNIC"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>CNIC</Text>
                    <TextInput
                      style={[styles.input, errors.CNIC && styles.errorInput]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="12345-1234567-1"
                    />
                    {errors.CNIC && (
                      <Text style={styles.errorText}>
                        {errors.CNIC.message}
                      </Text>
                    )}
                  </View>
                )}
              />
              <Controller
                control={control}
                name="phoneNo"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.phoneNo && styles.errorInput,
                      ]}
                      value={value}
                      onChangeText={onChange}
                      placeholder="03123456789"
                    />
                    {errors.phoneNo && (
                      <Text style={styles.errorText}>
                        {errors.phoneNo.message}
                      </Text>
                    )}
                  </View>
                )}
              />
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnCancel]}
                  onPress={closeModal}
                >
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={handleSubmit(onSubmit)}
                >
                  <Text style={styles.btnText}>
                    {isLoading
                      ? "Saving..."
                      : editingRider
                      ? "Update"
                      : "Create"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: { fontSize: 24, fontWeight: "bold" },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
  },
  btn: {
    padding: 10,
    borderRadius: 4,
    marginVertical: 4,
    alignItems: "center",
  },
  btnPrimary: { backgroundColor: "#4caf50" },
  btnEdit: { backgroundColor: "#2196f3", marginRight: 8 },
  btnDelete: { backgroundColor: "#f44336", marginRight: 8 },
  btnCancel: { backgroundColor: "#9e9e9e", marginRight: 8 },
  btnText: { color: "white", fontWeight: "bold" },
  errorMessage: { color: "#c62828", marginBottom: 10 },
  table: { minWidth: 600 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f5f5f5" },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 8,
  },
  cell: { flex: 1, paddingHorizontal: 8 },
  headerCell: { fontWeight: "bold" },
  cellActions: { flexDirection: "row" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modal: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    width: "90%",
    maxHeight: "90%",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  formGroup: { marginBottom: 16 },
  label: { fontWeight: "bold", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
  },
  errorInput: { borderColor: "#f44336" },
  errorText: { color: "#f44336", fontSize: 12, marginTop: 4 },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
});

export default RiderManagement;
