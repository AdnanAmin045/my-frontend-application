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
  TextInput,
  ScrollView,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { API_URL } from "../baseURL";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const statusOptions = [
  "pending",
  "processing",
  "ready for Pickup",
  "out for Delivery",
  "delivered",
  "cancelled",
];

// Zod schema for measurement validation
const measurementSchema = z.object({
  chest: z.number({ required_error: "Chest is required" }),
  waist: z.number({ required_error: "Waist is required" }),
  hips: z.number({ required_error: "Hips is required" }),
  shoulder: z.number({ required_error: "Shoulder is required" }),
  sleeveLength: z.number({ required_error: "Sleeve length is required" }),
  shirtLength: z.number({ required_error: "Shirt length is required" }),
  trouserLength: z.number({ required_error: "Trouser length is required" }),
  inseam: z.number({ required_error: "Inseam is required" }),
  neck: z.number({ required_error: "Neck is required" }),
  notes: z.string().max(500, "Notes must not exceed 500 characters").optional(),
});

const OrdersManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [measurementModal, setMeasurementModal] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      chest: 0,
      waist: 0,
      hips: 0,
      shoulder: 0,
      sleeveLength: 0,
      shirtLength: 0,
      trouserLength: 0,
      inseam: 0,
      neck: 0,
      notes: "",
    },
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const user = await AsyncStorage.getItem("user");
      const token = user ? JSON.parse(user).accessToken : null;

      const response = await axios.get(`${API_URL}/orders/provider-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched Orders:", response.data.orders);
      setOrders(response.data.orders.map(order => ({
        ...order,
        measurements: order.user?.measurements || null,
      })));
      console.log("Orders with Measurements:", orders);
    } catch (err) {
      console.error(err);
      alert("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderTrackingId, newStatus) => {
    try {
      const user = await AsyncStorage.getItem("user");
      const token = user ? JSON.parse(user).accessToken : null;

      await axios.patch(
        `${API_URL}/orders/status/${orderTrackingId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Status updated successfully");
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const saveMeasurement = async (data) => {
    try {
      const user = await AsyncStorage.getItem("user");
      const token = user ? JSON.parse(user).accessToken : null;

      await axios.patch(
        `${API_URL}/orders/addMeasurement/${selectedOrder.orderTrackingId}`,
        { measurements: data },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Measurement saved successfully");
      setMeasurementModal(false);
      reset();
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to save measurement");
    }
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setStatusModalVisible(true);
  };

  const openMeasurementModal = (order) => {
    setSelectedOrder(order);
    if (order.measurements) {
      setValue("chest", order.measurements.chest || 0);
      setValue("waist", order.measurements.waist || 0);
      setValue("hips", order.measurements.hips || 0);
      setValue("shoulder", order.measurements.shoulder || 0);
      setValue("sleeveLength", order.measurements.sleeveLength || 0);
      setValue("shirtLength", order.measurements.shirtLength || 0);
      setValue("trouserLength", order.measurements.trouserLength || 0);
      setValue("inseam", order.measurements.inseam || 0);
      setValue("neck", order.measurements.neck || 0);
      setValue("notes", order.measurements.notes || "");
    } else {
      reset();
    }
    setMeasurementModal(true);
  };

  const filteredOrders = orders
    .filter((o) => (filterStatus === "all" ? true : o.status === filterStatus))
    .filter((o) =>
      o.orderTrackingId.toLowerCase().includes(searchText.toLowerCase())
    );

  if (loading) {
    return (
        <ActivityIndicator size="large" color="#6200ea" />
    );
  }

  return (
   <>
  
      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search by Order ID"
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* Status Filter */}
      <ScrollView
        horizontal
        style={styles.filterContainer}
        showsHorizontalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus === "all" && styles.activeFilter,
          ]}
          onPress={() => setFilterStatus("all")}
        >
          <Text
            style={[
              styles.filterText,
              filterStatus === "all" && styles.activeFilterText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.activeFilter,
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                styles.filterText,
                filterStatus === status && styles.activeFilterText,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>Order: {item.orderTrackingId}</Text>
              <Text style={[styles.status, { textTransform: "capitalize" }]}>
                {item.status}
              </Text>
            </View>

            {item.services.map((s, i) => (
              <View key={i} style={styles.serviceRow}>
                <Text style={styles.serviceName}>
                  {s.name} x{s.quantity}
                </Text>
                <Text style={styles.servicePrice}>${s.price}</Text>
              </View>
            ))}

            <Text style={styles.totalPayment}>
              Total Payment: ${item.totalPayment.toFixed(2)}
            </Text>
            <Text style={styles.address}>
              {item.address.homeAddress} | {item.address.phoneNo} |{" "}
              {item.address.email}
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.statusButton}
                onPress={() => openStatusModal(item)}
              >
                <Icon name="update" size={20} color="#fff" />
                <Text style={styles.buttonText}>Update Status</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.measureButton}
                onPress={() => openMeasurementModal(item)}
              >
                <Icon name="ruler" size={20} color="#fff" />
                <Text style={styles.buttonText}>Measurement</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Status Modal */}
      <Modal visible={statusModalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Update Status for Order {selectedOrder?.orderTrackingId}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {statusOptions.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.statusOption}
                  onPress={() => {
                    updateStatus(selectedOrder.orderTrackingId, s);
                    setStatusModalVisible(false);
                  }}
                >
                  <Text style={styles.statusText}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.cancelButton, styles.statusCancelButton]}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Measurement Modal */}
      <Modal visible={measurementModal} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {selectedOrder?.measurements ? "Edit Measurement" : "Add Measurement"} for Order {selectedOrder?.orderTrackingId}
            </Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Controller
                control={control}
                name="chest"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Chest (in inches)"
                    value={value ? value.toString() : ""}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : 0)}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.chest && <Text style={styles.errorText}>{errors.chest.message}</Text>}
              <Controller
                control={control}
                name="waist"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Waist (in inches)"
                    value={value ? value.toString() : ""}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : 0)}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.waist && <Text style={styles.errorText}>{errors.waist.message}</Text>}
              <Controller
                control={control}
                name="hips"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Hips (in inches)"
                    value={value ? value.toString() : ""}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : 0)}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.hips && <Text style={styles.errorText}>{errors.hips.message}</Text>}
              <Controller
                control={control}
                name="shoulder"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Shoulder (in inches)"
                    value={value ? value.toString() : ""}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : 0)}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.shoulder && <Text style={styles.errorText}>{errors.shoulder.message}</Text>}
              <Controller
                control={control}
                name="sleeveLength"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Sleeve Length (in inches)"
                    value={value ? value.toString() : ""}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : 0)}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.sleeveLength && <Text style={styles.errorText}>{errors.sleeveLength.message}</Text>}
              <Controller
                control={control}
                name="shirtLength"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Shirt Length (in inches)"
                    value={value ? value.toString() : ""}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : 0)}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.shirtLength && <Text style={styles.errorText}>{errors.shirtLength.message}</Text>}
              <Controller
                control={control}
                name="trouserLength"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Trouser Length (in inches)"
                    value={value ? value.toString() : ""}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : 0)}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.trouserLength && <Text style={styles.errorText}>{errors.trouserLength.message}</Text>}
              <Controller
                control={control}
                name="inseam"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Inseam (in inches)"
                    value={value ? value.toString() : ""}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : 0)}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.inseam && <Text style={styles.errorText}>{errors.inseam.message}</Text>}
              <Controller
                control={control}
                name="neck"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Neck (in inches)"
                    value={value ? value.toString() : ""}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : 0)}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.neck && <Text style={styles.errorText}>{errors.neck.message}</Text>}
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="Notes (optional)"
                    value={value || ""}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.notes && <Text style={styles.errorText}>{errors.notes.message}</Text>}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit(saveMeasurement)}
              >
                <Text style={styles.buttonText}>{selectedOrder?.measurements ? "Edit" : "Save"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setMeasurementModal(false);
                  reset();
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
     </>
  );
};

export default OrdersManager;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f5f5f5", 
    paddingTop: 10 
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 25,
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
    marginRight: 8,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  activeFilter: { 
    backgroundColor: "#6200ea" 
  },
  filterText: { 
    color: "#1f2937", 
    fontWeight: "600", 
    fontSize: 12 
  },
  activeFilterText: { 
    color: "#fff" 
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderId: { 
    fontWeight: "700", 
    fontSize: 16, 
    color: "#1f2937" 
  },
  status: { 
    fontWeight: "600", 
    color: "#6200ea", 
    fontSize: 14 
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  serviceName: { 
    fontSize: 14, 
    color: "#374151" 
  },
  servicePrice: { 
    fontWeight: "600", 
    color: "#1f2937" 
  },
  totalPayment: { 
    fontWeight: "700", 
    marginTop: 8, 
    color: "#1f2937" 
  },
  address: { 
    fontSize: 12, 
    color: "#6b7280", 
    marginTop: 4 
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  measureButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f39c12",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "600", 
    fontSize: 14,
    textAlign: "center",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContainer: { 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    padding: 16 
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1f2937",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  statusCancelButton: {
    marginTop: 12,
    alignSelf: "center",
    width: "60%",
    justifyContent: "center",
  },
  statusOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  statusText: { 
    fontSize: 16, 
    color: "#1f2937",
    fontWeight: "500",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 8,
  },
});