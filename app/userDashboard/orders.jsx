import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../baseURL";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

// Define validation schemas with Zod
const reviewSchema = z.object({
  rating: z.number().min(1, "Rating is required"),
  comment: z.string().optional(),
});

// Measurement schema - all fields optional but must be valid decimal strings if provided
const measurementSchema = z.object({
  chest: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid decimal format (max 2 decimal places)").optional().or(z.literal("")),
  waist: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid decimal format (max 2 decimal places)").optional().or(z.literal("")),
  hips: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid decimal format (max 2 decimal places)").optional().or(z.literal("")),
  shoulder: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid decimal format (max 2 decimal places)").optional().or(z.literal("")),
  sleeveLength: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid decimal format (max 2 decimal places)").optional().or(z.literal("")),
  shirtLength: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid decimal format (max 2 decimal places)").optional().or(z.literal("")),
  trouserLength: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid decimal format (max 2 decimal places)").optional().or(z.literal("")),
  inseam: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid decimal format (max 2 decimal places)").optional().or(z.literal("")),
  neck: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid decimal format (max 2 decimal places)").optional().or(z.literal("")),
  notes: z.string().optional(),
});

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState("");
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [measurementModalVisible, setMeasurementModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittingMeasurement, setSubmittingMeasurement] = useState(false);

  // Review form
  const {
    control: reviewControl,
    handleSubmit: handleReviewSubmit,
    formState: { errors: reviewErrors },
    reset: resetReview,
    setValue: setReviewValue,
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  // Measurement form
  const {
    control: measurementControl,
    handleSubmit: handleMeasurementSubmit,
    formState: { errors: measurementErrors },
    reset: resetMeasurement,
  } = useForm({
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

      const response = await axios.get(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data.data || []);
    } catch (err) {
(err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((order) =>
    order.orderTrackingId.toLowerCase().includes(searchText.toLowerCase())
  );

  const openReviewModal = (order) => {
    setSelectedOrder(order);
    setReviewModalVisible(true);
    resetReview({ rating: 0, comment: "" });
  };

  const closeReviewModal = () => {
    setReviewModalVisible(false);
    setSelectedOrder(null);
  };

  const openMeasurementModal = (order, service) => {
    setSelectedOrder(order);
    setSelectedService(service);
    setMeasurementModalVisible(true);
    resetMeasurement();
  };

  const closeMeasurementModal = () => {
    setMeasurementModalVisible(false);
    setSelectedOrder(null);
    setSelectedService(null);
  };

  const submitReview = async (data) => {
    if (!selectedOrder) return;

    try {
      setSubmittingReview(true);
      const user = await AsyncStorage.getItem("user");
      const token = user ? JSON.parse(user).accessToken : null;
      const reviewData = {
        orderId: selectedOrder._id,
        serviceProvider: selectedOrder.serviceProvider?._id,
        rating: data.rating,
        comment: data.comment,
      };

      const response = await axios.post(
        `${API_URL}/feedback/create`,
        reviewData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Thank you for your review!");
        fetchOrders();
        closeReviewModal();
      }
    } catch (err) {
(err);
      Alert.alert("Error", "Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const submitMeasurement = async (data) => {
    if (!selectedOrder || !selectedService) return;

    try {
      setSubmittingMeasurement(true);
      const user = await AsyncStorage.getItem("user");
      const token = user ? JSON.parse(user).accessToken : null;
      
      // Filter out undefined values
      const measurementData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== undefined && value !== "")
      );

      const response = await axios.post(
        `${API_URL}/measurements/create`,
        {
          serviceProviderId: selectedOrder.serviceProvider?._id,
          orderId: selectedOrder._id,
          ...measurementData
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Measurements added successfully!");
        fetchOrders();
        closeMeasurementModal();
      }

    } catch (err) {
(err);
      Alert.alert("Error", "Failed to save measurements. Please try again.");
    } finally {
      setSubmittingMeasurement(false);
    }
  };

  const needsMeasurement = (service,measurementAdded) => {
    return service.name.toLowerCase().includes("tailor") && !measurementAdded;
  };
  const renderOrderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.orderId}>Order ID: {item.orderTrackingId}</Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Service Provider */}
      <Text style={styles.provider}>
        Service Provider: {item.serviceProvider?.username || "N/A"}
      </Text>

      {/* Status */}
      <Text style={styles.status}>
        Status: <Text style={styles.statusText}>{item.status}</Text>
      </Text>

      {/* Total Payment */}
      <Text style={styles.totalPayment}>
        Total Payment: PKR {item.totalPayment.toFixed(2)}
      </Text>

      {/* Address */}
      <Text style={styles.address}>
        {item.address.homeAddress} | {item.address.phoneNo} |{" "}
        {item.address.email}
      </Text>

      {/* Services */}
      <Text style={styles.servicesLabel}>Services:</Text>
      {item.services.map((service, index) => (
        <View key={index} style={styles.serviceRow}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>
              {service.name} x{service.quantity}
            </Text>
            <Text style={styles.servicePrice}>PKR: {service.price}</Text>
          </View>
          {/* Add Measurement Button for Tailor services */}
          {needsMeasurement(service,item.measurementAdded) && (
            <TouchableOpacity
              style={styles.measurementButton}
              onPress={() => openMeasurementModal(item, service)}
            >
              <Text style={styles.measurementButtonText}>Add Measurements</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Review Button */}
      {!item.isFeedBackGiven && item.status === "delivered" && (
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => openReviewModal(item)}
        >
          <Text style={styles.reviewButtonText}>Leave a Review</Text>
        </TouchableOpacity>
      )}

      {/* Review Display */}
      {item.isFeedBackGiven && item.review && (
        <View style={styles.reviewContainer}>
          <Text style={styles.reviewTitle}>Your Review:</Text>
          <View style={styles.reviewRating}>
            <Text style={styles.reviewRatingText}>Rating: </Text>
            <View style={styles.starsDisplay}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text
                  key={star}
                  style={[
                    styles.star,
                    star <= item.review.rating ? styles.starFilled : styles.starEmpty
                  ]}
                >
                  ★
                </Text>
              ))}
            </View>
            <Text style={styles.reviewRatingNumber}>({item.review.rating}/5)</Text>
          </View>
          {item.review.comment && (
            <Text style={styles.reviewComment}>"{item.review.comment}"</Text>
          )}
          <Text style={styles.reviewDate}>
            Reviewed on: {new Date(item.review.createdAt).toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* Feedback Given Message (fallback) */}
      {item.isFeedBackGiven && !item.review && (
        <Text style={styles.feedbackGivenText}>
          Thank you for your feedback!
        </Text>
      )}
    </View>
  );

  // Measurement input field component
  const MeasurementInput = ({ name, label, control, errors }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{measurementLabels[name]} (inches)</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder={`Enter ${measurementLabels[name]} in inches`}
            keyboardType="decimal-pad"
            value={value || ""}
            onChangeText={(text) => {
              // Handle decimal values properly (up to 2 decimal places)
              if (text === "" || text === null) {
                onChange("");
                return;
              }
              
              // Allow only numbers and one decimal point
              const cleanVal = text.replace(/[^0-9.]/g, '');
              
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
        )}
      />
      {errors[name] && (
        <Text style={styles.errorText}>{errors[name].message}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order History</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by Order ID"
        value={searchText}
        onChangeText={setSearchText}
      />

      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6200ea" />
        </View>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!loading && !error && filteredOrders.length === 0 && (
        <Text style={styles.noOrdersText}>No orders found</Text>
      )}

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
      />

      {/* Review Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reviewModalVisible}
        onRequestClose={closeReviewModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Your Experience</Text>
            <Text style={styles.modalSubtitle}>
              Order ID: {selectedOrder?.orderTrackingId}
            </Text>

            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Rating *</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Controller
                    key={star}
                    control={reviewControl}
                    name="rating"
                    render={({ field: { value } }) => (
                      <TouchableOpacity
                        onPress={() => setReviewValue("rating", star)}
                        style={styles.starButton}
                      >
                        <Text
                          style={[
                            styles.star,
                            star <= value
                              ? styles.filledStar
                              : styles.emptyStar,
                          ]}
                        >
                          {star <= value ? "★" : "☆"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                ))}
              </View>
              {reviewErrors.rating && (
                <Text style={styles.errorText}>{reviewErrors.rating.message}</Text>
              )}
            </View>

            <View style={styles.commentContainer}>
              <Text style={styles.commentLabel}>Comment (Optional)</Text>
              <Controller
                control={reviewControl}
                name="comment"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={styles.commentInput}
                    multiline
                    numberOfLines={4}
                    placeholder="Share your experience with this service..."
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeReviewModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleReviewSubmit(submitReview)}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Measurement Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={measurementModalVisible}
        onRequestClose={closeMeasurementModal}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Measurements / پیمائش شامل کریں</Text>
            <Text style={styles.modalSubtitle}>
              For {selectedService?.name} - Order: {selectedOrder?.orderTrackingId}
            </Text>
            <Text style={styles.measurementNote}>
              All measurements are in inches with decimal support (max 2 decimal places). Fields are optional. / تمام پیمائشیں انچ میں ہیں (2 اعشاریہ جگہوں تک)۔ فیلڈز اختیاری ہیں۔
            </Text>

            <MeasurementInput
              name="chest"
              label="Chest"
              control={measurementControl}
              errors={measurementErrors}
            />
            <MeasurementInput
              name="waist"
              label="Waist"
              control={measurementControl}
              errors={measurementErrors}
            />
            <MeasurementInput
              name="hips"
              label="Hips"
              control={measurementControl}
              errors={measurementErrors}
            />
            <MeasurementInput
              name="shoulder"
              label="Shoulder"
              control={measurementControl}
              errors={measurementErrors}
            />
            <MeasurementInput
              name="sleeveLength"
              label="Sleeve Length"
              control={measurementControl}
              errors={measurementErrors}
            />
            <MeasurementInput
              name="shirtLength"
              label="Shirt Length"
              control={measurementControl}
              errors={measurementErrors}
            />
            <MeasurementInput
              name="trouserLength"
              label="Trouser Length"
              control={measurementControl}
              errors={measurementErrors}
            />
            <MeasurementInput
              name="inseam"
              label="Inseam"
              control={measurementControl}
              errors={measurementErrors}
            />
            <MeasurementInput
              name="neck"
              label="Neck"
              control={measurementControl}
              errors={measurementErrors}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{measurementLabels.notes}</Text>
              <Controller
                control={measurementControl}
                name="notes"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, { height: 80 }]}
                    multiline
                    placeholder="Additional notes or special instructions / اضافی نوٹس یا خصوصی ہدایات"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeMeasurementModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleMeasurementSubmit(submitMeasurement)}
                disabled={submittingMeasurement}
              >
                {submittingMeasurement ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Save Measurements / پیمائش محفوظ کریں</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default OrderHistory;

const styles = StyleSheet.create({
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "center",
  },
  serviceInfo: {
    flex: 1,
  },
  measurementButton: {
    backgroundColor: "#03a9f4",
    padding: 8,
    borderRadius: 6,
    marginLeft: 10,
  },
  measurementButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  measurementNote: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    marginTop:20,
    paddingHorizontal:10
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#1f2937",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 10,
  },
  noOrdersText: {
    textAlign: "center",
    color: "#6b7280",
    marginVertical: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  date: {
    fontSize: 12,
    color: "#6b7280",
  },
  provider: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  statusText: {
    fontWeight: "600",
    color: "#6200ea",
    textTransform: "capitalize",
  },
  totalPayment: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  servicesLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  serviceName: {
    fontSize: 14,
    color: "#374151",
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  reviewButton: {
    backgroundColor: "#6200ea",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  reviewButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  feedbackGivenText: {
    color: "#10b981",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
    fontSize: 16,
  },
  reviewContainer: {
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#10b981",
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 6,
  },
  reviewRating: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  reviewRatingText: {
    fontSize: 12,
    color: "#6b7280",
    marginRight: 6,
  },
  starsDisplay: {
    flexDirection: "row",
    marginRight: 6,
  },
  star: {
    fontSize: 20,
    marginRight: 1,
  },
  starFilled: {
    color: "#fbbf24",
  },
  starEmpty: {
    color: "#d1d5db",
  },
  reviewRatingNumber: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  reviewComment: {
    fontSize: 12,
    color: "#374151",
    fontStyle: "italic",
    marginBottom: 6,
    lineHeight: 16,
  },
  reviewDate: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "right",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
    textAlign: "center",
  },
  ratingContainer: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 4,
  },
  starButton: {
    padding: 4,
  },
  filledStar: {
    color: "#ffc107",
  },
  emptyStar: {
    color: "#d1d5db",
  },
  commentContainer: {
    marginBottom: 20,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    minHeight: 100,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom:60
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#6200ea",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
