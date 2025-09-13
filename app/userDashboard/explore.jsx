import React, { useEffect, useState, useRef } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Animated,
  Alert,
} from "react-native";
import AnimatedReanimated, { FadeInUp } from "react-native-reanimated";
import * as Location from "expo-location";
import axios from "axios";
import { useRouter } from "expo-router";
import { z } from "zod";
import { CardField, useStripe } from "@stripe/stripe-react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { API_URL } from "../baseURL";
import AsyncStorage from "@react-native-async-storage/async-storage";

const orderSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters long"),
  phone: z.string().regex(/^\d{10,15}$/, "Phone number must be 10-15 digits"),
  email: z.string().email("Invalid email address"),
  selectedServices: z
    .array(
      z.object({ name: z.string(), price: z.number(), quantity: z.number() })
    )
    .min(1, "At least one service must be selected"),
});

const Explore = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [cardDetails, setCardDetails] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const { confirmPayment, createPaymentMethod } = useStripe();
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrors({ general: "Location permission is required." });
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const user = await AsyncStorage.getItem("user");
        const token = user ? JSON.parse(user).accessToken : null;
        const response = await axios.get(`${API_URL}/offers/nearby`, {
          params: { lat: latitude, lng: longitude },
          headers: { Authorization: `Bearer ${token}` },
        });

        setOffers(response.data.offers);
      } catch (err) {
        console.error(err);
        setErrors({ general: "Failed to load offers." });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (paymentModalVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [paymentModalVisible]);

  const toggleService = (service) => {
    setSelectedServices((prev) => {
      const isSelected = prev.some((s) => s.name === service.name);
      const newServices = isSelected
        ? prev.filter((s) => s.name !== service.name)
        : [...prev, service];
      if (!isSelected) {
        setQuantities((prev) => ({
          ...prev,
          [service.name]: 1,
        }));
      } else {
        setQuantities((prev) => {
          const newQuantities = { ...prev };
          delete newQuantities[service.name];
          return newQuantities;
        });
      }
      setErrors((prev) => ({ ...prev, selectedServices: undefined }));
      return newServices;
    });
  };

  const handleQuantityChange = (serviceName, delta) => {
    setQuantities((prev) => {
      const currentQuantity = prev[serviceName] || 1;
      const newQuantity = Math.max(1, currentQuantity + delta);
      return { ...prev, [serviceName]: newQuantity };
    });
  };

  const calculateTotal = () => {
    if (!selectedServices || selectedServices.length === 0) return "0.00";
    const total = selectedServices.reduce((sum, service) => {
      const quantity = quantities[service.name] || 1;
      const basePrice = service.price * quantity;
      const discountPercentage = selectedOffer?.discountPercentage || 0;
      const discountAmount = (basePrice * discountPercentage) / 100;
      const discountedPrice = basePrice - discountAmount;
      return sum + parseFloat(discountedPrice.toFixed(2));
    }, 0);
    return total.toFixed(2);
  };

  const handlePay = async () => {
    try {
      const payload = {
        address,
        phone,
        email,
        selectedServices: selectedServices.map((s) => ({
          name: s.name,
          price: s.price,
          quantity: quantities[s.name] || 1,
        })),
      };

      const result = orderSchema.safeParse(payload);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        setErrors(fieldErrors);
        return;
      }

      setErrors({});
      setModalVisible(false);
      setPaymentModalVisible(true);
    } catch (err) {
      console.error(err);
      setErrors({ general: "Failed to validate order. Please try again." });
    }
  };

  const handlePaymentConfirm = async () => {
    console.log("handlePaymentConfirm called with cardDetails:", cardDetails);
    if (!cardDetails?.complete) {
      console.error("Card details incomplete");
      setErrors({ payment: "Please complete card details" });
      return;
    }
    setPaymentLoading(true);
    try {
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: "Card",
        card: cardDetails,
      });
      if (error) {
        console.error("Payment Method Error:", error);
        setErrors({ payment: `Payment failed: ${error.message}` });
        setPaymentLoading(false);
        return;
      }
      console.log("Payment Method Created:", paymentMethod);

      const user = await AsyncStorage.getItem("user");
      const token = user ? JSON.parse(user).accessToken : null;

      console.log("Sending paymentMethodId:", paymentMethod.id);
      const response = await axios.post(
        `${API_URL}/orders/create-and-confirm-payment`,
        {
          serviceProviderId: selectedOffer.serviceProvider._id,
          offerId: selectedOffer._id,
          services: selectedServices.map((s) => ({
            name: s.name,
            quantity: quantities[s.name] || 1,
            price: s.price,
          })),
          totalPayment: parseFloat(calculateTotal()),
          address: { homeAddress: address, phoneNo: phone, email },
          paymentMethodId: paymentMethod.id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("API Response:", response.data);

      Alert.alert("Success", "Order placed successfully!");
      setSelectedServices([]);
      setQuantities({});
      setAddress("");
      setPhone("");
      setEmail("");
      setErrors({});
      setCardDetails(null);
      setPaymentModalVisible(false);
    } catch (err) {
      console.error("Payment Error:", err.response?.data || err.message);
      setErrors({ payment: "Failed to process payment or save order." });
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    console.log(cardDetails);
  },[cardDetails]);

  const handleCancel = () => {
    setModalVisible(false);
    setPaymentModalVisible(false);
    setSelectedServices([]);
    setQuantities({});
    setAddress("");
    setPhone("");
    setEmail("");
    setErrors({});
    setCardDetails(null);
    setPaymentLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
        {errors.general && (
          <Text style={styles.errorText}>{errors.general}</Text>
        )}
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={offers}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <AnimatedReanimated.View
            entering={FadeInUp.delay(index * 100).springify()}
          >
            <View style={styles.card}>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/components/ProviderHistory",
                    params: { providerId: item.serviceProvider._id },
                  })
                }
              >
                <Text style={styles.offerTitle}>{item.title}</Text>
                <Text style={styles.username}>
                  {item.serviceProvider.username}
                </Text>
                <Text style={styles.providerInfo}>
                  {item.serviceProvider.shopAddress} |{" "}
                  {item.serviceProvider.phoneNo}
                </Text>
              </TouchableOpacity>
              <Text style={styles.offerDescription}>{item.description}</Text>
              {item.discountPercentage > 0 && (
                <Text style={styles.discount}>
                  Discount: {item.discountPercentage}% Off
                </Text>
              )}
              <View style={styles.divider} />
              {item.servicesIncluded.map((service, i) => (
                <View key={i} style={styles.serviceRow}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.servicePrice}>${service.price}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setSelectedOffer(item);
                  setQuantities(
                    item.servicesIncluded.reduce(
                      (acc, service) => ({
                        ...acc,
                        [service.name]: 1,
                      }),
                      {}
                    )
                  );
                  setModalVisible(true);
                }}
              >
                <Text style={styles.actionText}>Take Service</Text>
              </TouchableOpacity>
            </View>
          </AnimatedReanimated.View>
        )}
      />
      {/* Order Input Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalBackground}>
          <ScrollView style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{selectedOffer?.title}</Text>
            {selectedOffer?.servicesIncluded.map((service, i) => {
              const isSelected = selectedServices.some(
                (s) => s.name === service.name
              );
              return (
                <View key={i} style={styles.serviceRowModal}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxChecked,
                    ]}
                    onPress={() => toggleService(service)}
                  >
                    {isSelected && <Text style={styles.checkboxTick}>✓</Text>}
                  </TouchableOpacity>
                  <Text style={styles.serviceLabel}>
                    {service.name} - ${service.price}
                  </Text>
                  {isSelected && (
                    <View style={styles.quantityContainer}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleQuantityChange(service.name, -1)}
                      >
                        <Text style={styles.quantityButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>
                        {quantities[service.name] || 1}
                      </Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleQuantityChange(service.name, 1)}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
            {errors.selectedServices && (
              <Text style={styles.errorText}>{errors.selectedServices}</Text>
            )}
            <TextInput
              placeholder="Home Address"
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                setErrors((prev) => ({ ...prev, address: undefined }));
              }}
              style={[styles.input, errors.address && styles.inputError]}
            />
            {errors.address && (
              <Text style={styles.errorText}>{errors.address}</Text>
            )}
            <TextInput
              placeholder="Phone Number"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              keyboardType="phone-pad"
              style={[styles.input, errors.phone && styles.inputError]}
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone}</Text>
            )}
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              keyboardType="email-address"
              style={[styles.input, errors.email && styles.inputError]}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
            {errors.general && (
              <Text style={styles.errorText}>{errors.general}</Text>
            )}
            <Text style={styles.total}>Total: ${calculateTotal()}</Text>
            <TouchableOpacity style={styles.payButton} onPress={handlePay}>
              <Text style={styles.payText}>Pay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
      {/* Payment Modal */}
      {/* Payment Modal */}
      <Modal
        transparent={true}
        visible={paymentModalVisible}
        animationType="none"
        onRequestClose={handleCancel}
      >
        {/* Overlay press will ALWAYS close modal now */}
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <Animated.View
            style={[
              styles.paymentModalContainer,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Header with close button */}
            <View style={styles.header}>
              <Text style={styles.modalTitle}>Secure Payment</Text>
              <TouchableOpacity onPress={handleCancel}>
                <Icon name="times" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amountValue}>${calculateTotal()}</Text>
            </View>

            {/* Card Field */}
            <Text style={styles.cardLabel}>Card Information</Text>
            <View
              style={[
                styles.cardFieldContainer,
                errors.payment && styles.cardFieldContainerError,
              ]}
            >
              <CardField
               postalCodeEnabled={false}
                placeholders={{
                  number: "4242 4242 4242 4242",
                  expiration: "MM/YY",
                  cvc: "CVC",
                }}
                cardStyle={{
                  backgroundColor: "#ffffff",
                  textColor: "#000000",
                  placeholderColor: "#999999",
                  textErrorColor: "#ff0000",
                  fontSize: 16,
                }}
                style={styles.cardField}
                onCardChange={setCardDetails}
              />
            </View>
            {errors.payment && (
              <Text style={styles.errorText}>{errors.payment}</Text>
            )}

            {/* Pay Button */}
            <TouchableOpacity
              style={[
                styles.payButton,
                (!cardDetails?.complete || paymentLoading) &&
                  styles.disabledButton,
              ]}
              onPress={handlePaymentConfirm}
              disabled={!cardDetails?.complete || paymentLoading}
            >
              {paymentLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Icon name="lock" size={16} color="#FFF" />
                  <Text style={styles.payButtonText}>Pay Securely</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Security Info */}
            <View style={styles.securityInfo}>
              <Icon name="shield-alt" size={14} color="#10B981" />
              <Text style={styles.securityText}>Payments are 100% secure</Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  offerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  providerInfo: {
    fontSize: 14,
    color: "#555",
    marginBottom: 12,
  },
  offerDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  discount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e91e63",
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  actionButton: {
    backgroundColor: "#6200ea",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    margin: 20,
    borderRadius: 16,
    padding: 20,
    maxHeight: "70%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  paymentModalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: "50%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  serviceRowModal: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#6200ea",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#6200ea",
  },
  checkboxTick: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  serviceLabel: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#6200ea",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  quantityButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  quantityText: {
    fontSize: 16,
    color: "#333",
    width: 40,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#dc3545",
  },
  cardFieldContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 2,
    marginVertical: 10,
  },
  cardFieldContainerError: {
    borderColor: "#dc3545",
  },
  cardField: {
    height: 50,
    width: "100%",
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginBottom: 6,
    marginLeft: 4,
  },
  payButton: {
    backgroundColor: "#28a745",
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  payButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  securityText: {
    fontSize: 12,
    color: "#10B981",
    marginLeft: 4,
  },
  total: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginVertical: 12,
    textAlign: "right",
  },
  payText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  closeButton: {
    borderWidth: 1,
    borderColor: "#dc3545",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  closeText: {
    color: "#dc3545",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default Explore;
