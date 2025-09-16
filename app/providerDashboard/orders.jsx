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
import { API_URL } from "../../baseURL";
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
  notes: z.string().max(500).optional(),
});

const OrdersManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [measurementModal, setMeasurementModal] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset, setValue } =
    useForm({
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
      setOrders(
        response.data.orders.map((order) => ({
          ...order,
          measurements: order.user?.measurements || null,
        }))
      );
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
      Object.keys(order.measurements).forEach((key) =>
        setValue(key, order.measurements[key] || 0)
      );
      setValue("notes", order.measurements.notes || "");
    } else {
      reset();
    }
    setMeasurementModal(true);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<Icon key={i} name="star" size={18} color="#FFD700" />);
      } else if (i - 0.5 === rating) {
        stars.push(<Icon key={i} name="star-half-full" size={18} color="#FFD700" />);
      } else {
        stars.push(<Icon key={i} name="star-outline" size={18} color="#FFD700" />);
      }
    }
    return <View style={{ flexDirection: "row", marginTop: 4 }}>{stars}</View>;
  };

  const filteredOrders = orders
    .filter((o) => (filterStatus === "all" ? true : o.status === filterStatus))
    .filter((o) => o.orderTrackingId.toLowerCase().includes(searchText.toLowerCase()));

  if (loading) {
    return <ActivityIndicator size="large" color="#6200ea" style={{ flex: 1, justifyContent: "center" }} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search */}
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
        contentContainerStyle={styles.filterContentContainer}
      >
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === "all" && styles.activeFilter]} 
          onPress={() => setFilterStatus("all")}
        >
          <Text style={[styles.filterText, filterStatus === "all" && styles.activeFilterText]}>All</Text>
        </TouchableOpacity>
        {statusOptions.map((status) => (
          <TouchableOpacity 
            key={status} 
            style={[styles.filterButton, filterStatus === status && styles.activeFilter]} 
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[styles.filterText, filterStatus === status && styles.activeFilterText]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>Order: {item.orderTrackingId}</Text>
              <Text style={[styles.status, { textTransform: "capitalize" }]}>{item.status}</Text>
            </View>

            {item.services.map((s, i) => (
              <View key={i} style={styles.serviceRow}>
                <Text style={styles.serviceName}>{s.name} x{s.quantity}</Text>
                <Text style={styles.servicePrice}>${s.price}</Text>
              </View>
            ))}

            <Text style={styles.totalPayment}>Total Payment: ${item.totalPayment.toFixed(2)}</Text>
            <Text style={styles.address}>
              {item.address.homeAddress} | {item.address.phoneNo} | {item.address.email}
            </Text>

            {/* Feedback Stars */}
            {item.isFeedBackGiven && item.feedback?.length > 0 && (
              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackUser}>Feedback by: {item.user.username}</Text>
                {renderStars(item.feedback[0].rating)}
                {item.feedback[0].comment ? (
                  <Text style={styles.feedbackComment}>{item.feedback[0].comment}</Text>
                ) : null}
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.statusButton} onPress={() => openStatusModal(item)}>
                <Icon name="update" size={20} color="#fff" />
                <Text style={styles.buttonText}>Update Status</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.measureButton} onPress={() => openMeasurementModal(item)}>
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
            <Text style={styles.modalTitle}>
              Update Status for Order {selectedOrder?.orderTrackingId}
            </Text>
            {statusOptions.map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.modalOption}
                onPress={() => {
                  updateStatus(selectedOrder.orderTrackingId, status);
                  setStatusModalVisible(false);
                }}
              >
                <Text style={styles.modalOptionText}>{status}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modalOption, { backgroundColor: "#ccc", marginTop: 10 }]}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={styles.modalOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Measurement Modal */}
      <Modal visible={measurementModal} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { maxHeight: "90%" }]}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                Add / Edit Measurement for Order {selectedOrder?.orderTrackingId}
              </Text>

              {Object.keys(measurementSchema.shape).map((field) => {
                if (field === "notes") {
                  return (
                    <Controller
                      key={field}
                      control={control}
                      name={field}
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          placeholder="Notes"
                          style={[styles.input, { height: 80 }]}
                          value={value}
                          onChangeText={onChange}
                          multiline
                        />
                      )}
                    />
                  );
                }
                return (
                  <Controller
                    key={field}
                    control={control}
                    name={field}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                        style={styles.input}
                        keyboardType="numeric"
                        value={value.toString()}
                        onChangeText={(val) => onChange(Number(val))}
                      />
                    )}
                  />
                );
              })}

              <TouchableOpacity
                style={[styles.statusButton, { marginTop: 10 }]}
                onPress={handleSubmit(saveMeasurement)}
              >
                <Text style={styles.buttonText}>Save Measurement</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOption, { backgroundColor: "#ccc", marginTop: 10 }]}
                onPress={() => setMeasurementModal(false)}
              >
                <Text style={styles.modalOptionText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 10, 
    backgroundColor: "#f5f5f5" 
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  filterContainer: { 
    marginBottom: 12,
    maxHeight: 40,
  },
  filterContentContainer: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 36,
  },
  activeFilter: { 
    backgroundColor: "#6200ea" 
  },
  filterText: { 
    color: "#555",
    fontSize: 14,
  },
  activeFilterText: { 
    color: "#fff", 
    fontWeight: "bold" 
  },
  card: { 
    backgroundColor: "#fff", 
    borderRadius: 10, 
    padding: 16, 
    marginBottom: 12, 
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  cardHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 8,
    alignItems: 'center',
  },
  orderId: { 
    fontWeight: "bold", 
    fontSize: 16,
    flex: 1,
  },
  status: { 
    fontWeight: "bold", 
    color: "#6200ea",
    fontSize: 14,
  },
  serviceRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginVertical: 4,
  },
  serviceName: { 
    fontSize: 14,
    flex: 1,
  },
  servicePrice: { 
    fontWeight: "bold",
    marginLeft: 8,
  },
  totalPayment: { 
    fontWeight: "bold", 
    marginTop: 6,
    fontSize: 15,
  },
  address: { 
    fontStyle: "italic", 
    fontSize: 12, 
    marginTop: 4,
    color: '#666',
  },
  buttonRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 12,
  },
  statusButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#6200ea", 
    padding: 10, 
    borderRadius: 6,
    flex: 1,
    marginRight: 6,
    justifyContent: 'center',
  },
  measureButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#03a9f4", 
    padding: 10, 
    borderRadius: 6,
    flex: 1,
    marginLeft: 6,
    justifyContent: 'center',
  },
  buttonText: { 
    color: "#fff", 
    marginLeft: 6, 
    fontWeight: "bold",
    fontSize: 14,
  },
  modalBackground: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  modalContainer: { 
    width: "85%", 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: { 
    padding: 12, 
    backgroundColor: "#6200ea", 
    borderRadius: 8, 
    marginVertical: 6,
  },
  modalOptionText: { 
    color: "#fff", 
    textAlign: "center", 
    fontWeight: "bold",
    fontSize: 15,
  },
  input: { 
    backgroundColor: "#f0f0f0", 
    padding: 12, 
    borderRadius: 8, 
    marginVertical: 6, 
    borderWidth: 1, 
    borderColor: "#ccc",
    fontSize: 16,
  },
  feedbackContainer: { 
    marginTop: 10, 
    backgroundColor: "#f9f9f9", 
    padding: 10, 
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  feedbackUser: { 
    fontWeight: "bold", 
    fontSize: 13, 
    marginBottom: 4,
  },
  feedbackComment: { 
    fontStyle: "italic", 
    fontSize: 12, 
    marginTop: 4, 
    color: "#333",
  },
});

export default OrdersManager;