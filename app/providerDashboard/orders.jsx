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
  KeyboardAvoidingView,
  Platform,
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

// Zod schema for measurement validation
const measurementSchema = z.object({
  chest: z.string().optional().refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), "Invalid decimal format (max 2 decimal places)"),
  waist: z.string().optional().refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), "Invalid decimal format (max 2 decimal places)"),
  hips: z.string().optional().refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), "Invalid decimal format (max 2 decimal places)"),
  shoulder: z.string().optional().refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), "Invalid decimal format (max 2 decimal places)"),
  sleeveLength: z.string().optional().refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), "Invalid decimal format (max 2 decimal places)"),
  shirtLength: z.string().optional().refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), "Invalid decimal format (max 2 decimal places)"),
  trouserLength: z.string().optional().refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), "Invalid decimal format (max 2 decimal places)"),
  inseam: z.string().optional().refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), "Invalid decimal format (max 2 decimal places)"),
  neck: z.string().optional().refine((val) => !val || /^\d+(\.\d{1,2})?$/.test(val), "Invalid decimal format (max 2 decimal places)"),
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
  const [savingMeasurement, setSavingMeasurement] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset, setValue } =
    useForm({
      resolver: zodResolver(measurementSchema),
      defaultValues: {
        chest: "",
        waist: "",
        hips: "",
        shoulder: "",
        sleeveLength: "",
        shirtLength: "",
        trouserLength: "",
        inseam: "",
        neck: "",
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
      alert("Failed to update status");
    }
  };

  const saveMeasurement = async (data) => {
    
    setSavingMeasurement(true);
    
    // Validate the data before sending
    try {
      const validatedData = measurementSchema.parse(data);
    } catch (validationError) {
      alert("Please check your input values. Some fields have invalid format.");
      setSavingMeasurement(false);
      return;
    }
    
    try {
      const user = await AsyncStorage.getItem("user");
      const token = user ? JSON.parse(user).accessToken : null;
      

      if (!selectedOrder?.orderTrackingId) {
        alert("No order selected");
        setSavingMeasurement(false);
        return;
      }

      const response = await axios.patch(
        `${API_URL}/orders/addMeasurement/${selectedOrder.orderTrackingId}`,
        { measurements: data },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Measurement saved successfully");
      setMeasurementModal(false);
      reset();
      fetchOrders();
    } catch (err) {
      alert(`Failed to save measurement: ${err.response?.data?.message || err.message}`);
    } finally {
      setSavingMeasurement(false);
    }
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setStatusModalVisible(true);
  };

 const openMeasurementModal = async (order) => {
  setSelectedOrder(order);

  try {
    // Get current provider ID
    const userData = await AsyncStorage.getItem("user");
    const parsedUser = JSON.parse(userData);
    
    // Extract provider ID from the JWT token or user data
    let currentProviderId = null;
    
    if (parsedUser?.accessToken) {
      try {
        // Decode JWT token to get the provider ID
        const tokenParts = parsedUser.accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = tokenParts[1];
          // Add padding if needed
          const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
          const decodedPayload = atob(paddedPayload);
          const tokenPayload = JSON.parse(decodedPayload);
          currentProviderId = tokenPayload._id;
        }
      } catch (tokenError) {
      }
    }
    
    // Fallback to direct user data fields
    if (!currentProviderId) {
      currentProviderId = parsedUser?._id || parsedUser?.id || parsedUser?.userId;
    }


    // Check if order has measurements data
    if (order.user && order.user.measurements && Array.isArray(order.user.measurements) && order.user.measurements.length > 0) {
      let existingMeasurement = null;
      
      // First try to find measurement for this specific provider
      if (currentProviderId) {
        existingMeasurement = order.user.measurements.find(
          (measurement) => measurement.serviceProviderId === currentProviderId || 
                          measurement.serviceProviderId === currentProviderId.toString()
        );
      }
      
      // If no specific provider measurement found, use the first available measurement
      if (!existingMeasurement && order.user.measurements.length > 0) {
        existingMeasurement = order.user.measurements[0];
      }


      if (existingMeasurement) {
        // Fill form values with existing measurement data
        Object.keys(measurementSchema.shape).forEach((key) => {
          if (key !== 'notes') {
            setValue(key, existingMeasurement[key] ?? "");
          } else {
            setValue(key, existingMeasurement[key] ?? "");
          }
        });
      } else {
        reset(); // Clear form if no measurement found
      }
    } else {
      reset(); // Clear form if no measurements found
    }
  } catch (error) {
    reset(); // Clear form on error
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
                <Text style={styles.servicePrice}>PKR: {s.price}</Text>
              </View>
            ))}

            <Text style={styles.totalPayment}>Total Payment: PKR {item.totalPayment.toFixed(2)}</Text>
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
        <KeyboardAvoidingView 
          style={styles.modalBackground}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={styles.modalScrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.modalContainer, { maxHeight: "90%" }]}>
              <ScrollView>
              <Text style={styles.modalTitle}>
                Add / Edit Measurement for Order {selectedOrder?.orderTrackingId} / آرڈر کے لیے پیمائش شامل/ترمیم کریں
              </Text>
              
              <Text style={styles.measurementNote}>
                All measurements are in inches with decimal support (max 2 decimal places). Fields are required. / تمام پیمائشیں انچ میں ہیں (2 اعشاریہ جگہوں تک)۔ فیلڈز ضروری ہیں۔
              </Text>

              {Object.keys(measurementSchema.shape).map((field) => {
                if (field === "notes") {
                  return (
                    <Controller
                      key={field}
                      control={control}
                      name={field}
                      render={({ field: { onChange, value } }) => (
                        <View>
                          <Text style={styles.measurementLabel}>{measurementLabels[field]}</Text>
                          <TextInput
                            placeholder="Additional notes / اضافی نوٹس"
                            style={[styles.input, { height: 80 }]}
                            value={value}
                            onChangeText={onChange}
                            multiline
                          />
                        </View>
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
                      <View>
                        <Text style={styles.measurementLabel}>
                          {measurementLabels[field]} (inches)
                        </Text>
                        <TextInput
                          placeholder={`${measurementLabels[field]} in inches`}
                          style={styles.input}
                          keyboardType="decimal-pad"
                          value={value || ""}
                          onChangeText={(val) => {
                            // Handle decimal values properly (up to 2 decimal places)
                            if (val === "" || val === null) {
                              onChange("");
                              return;
                            }
                            
                            // Allow only numbers and one decimal point
                            const cleanVal = val.replace(/[^0-9.]/g, '');
                            
                            // Ensure only one decimal point
                            const parts = cleanVal.split('.');
                            if (parts.length > 2) {
                              return; // Don't update if more than one decimal point
                            }
                            
                            // Limit to 2 decimal places
                            if (parts[1] && parts[1].length > 2) {
                              return; // Don't update if more than 2 decimal places
                            }
                            
                            onChange(cleanVal);
                          }}
                        />
                      </View>
                    )}
                  />
                );
              })}

              <TouchableOpacity
                style={[styles.statusButton, { marginTop: 10, opacity: savingMeasurement ? 0.7 : 1 }]}
                onPress={handleSubmit(saveMeasurement)}
                disabled={savingMeasurement}
              >
                {savingMeasurement ? (
                  <Text style={styles.buttonText}>Saving... / محفوظ ہو رہا ہے...</Text>
                ) : (
                  <Text style={styles.buttonText}>Save Measurement / پیمائش محفوظ کریں</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOption, { backgroundColor: "#ccc", marginTop: 10, opacity: savingMeasurement ? 0.7 : 1 }]}
                onPress={() => setMeasurementModal(false)}
                disabled={savingMeasurement}
              >
                <Text style={styles.modalOptionText}>Cancel</Text>
              </TouchableOpacity>
              </ScrollView>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
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
  measurementLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 8,
    color: '#333',
  },
  measurementNote: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
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