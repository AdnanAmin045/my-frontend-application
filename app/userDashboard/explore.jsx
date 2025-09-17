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
  Image,
  SafeAreaView,
} from "react-native";
import AnimatedReanimated, { FadeInUp } from "react-native-reanimated";
import * as Location from "expo-location";
import axios from "axios";
import { useRouter } from "expo-router";
import { z } from "zod";
import { CardField, useStripe } from "@stripe/stripe-react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { API_URL } from "../../baseURL";
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
  const [groupedOffers, setGroupedOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providerModalVisible, setProviderModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [cardDetails, setCardDetails] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const { confirmPayment } = useStripe();
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(300)).current;

  // Fetch offers & group by provider
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

        // ✅ Updated grouping according to API response
        const grouped = response.data.groupedOffers.map((group) => ({
          serviceProvider: group.provider,
          offers: group.offers,
        }));

        setGroupedOffers(grouped);
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

  const toggleService = (service, discountPercentage) => {
    const discountedPrice =
      service.price - (service.price * discountPercentage) / 100;
    setSelectedServices((prev) => {
      const isSelected = prev.some((s) => s.name === service.name);
      const newServices = isSelected
        ? prev.filter((s) => s.name !== service.name)
        : [...prev, { ...service, price: discountedPrice }];
      if (!isSelected) {
        setQuantities((prev) => ({ ...prev, [service.name]: 1 }));
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
      return sum + service.price * quantity;
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
      setOrderModalVisible(false);
      setPaymentModalVisible(true);
    } catch (err) {
      console.error(err);
      setErrors({ general: "Failed to validate order. Please try again." });
    }
  };

  const handlePaymentConfirm = async () => {
    if (!cardDetails?.complete) {
      setErrors({ payment: "Please complete card details" });
      return;
    }
    setPaymentLoading(true);

    try {
      const user = await AsyncStorage.getItem("user");
      const token = user ? JSON.parse(user).accessToken : null;

      const totalPKR = parseFloat(calculateTotal());

      let rateUSD = 0.0036;

      const totalUSD = totalPKR * rateUSD;

      const MIN_USD = 0.5;

      if (totalUSD < MIN_USD) {
        setErrors({ payment: `Minimum payment is $${MIN_USD.toFixed(2)} USD` });
        setPaymentLoading(false);
        return;
      }

      const paymentIntentRes = await axios.post(
        `${API_URL}/orders/create-payment-intent`,
        {
          amount: Math.round(totalUSD * 100),
          currency: "usd",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const clientSecret = paymentIntentRes.data.clientSecret;

      const { paymentIntent, error } = await confirmPayment(clientSecret, {
        paymentMethodType: "Card",
        paymentMethodData: {
          billingDetails: { email, phone, address: { line1: address } },
        },
      });

      if (error) {
        setErrors({ payment: error.message });
        setPaymentLoading(false);
        return;
      }

      await axios.post(
        `${API_URL}/orders/createOrder`,
        {
          serviceProviderId: selectedOffer.providerId,
          offerId: selectedOffer._id,
          services: selectedServices.map((s) => ({
            name: s.name,
            quantity: quantities[s.name] || 1,
            price: s.price,
          })),
          totalPayment: totalPKR,
          totalPaymentUSD: totalUSD,
          address: { homeAddress: address, phoneNo: phone, email },
          paymentIntentId: paymentIntent.id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "Payment successful and order placed!");
      handleCancel();
    } catch (err) {
      console.error("Payment error:", err.response?.data || err.message);
      setErrors({
        payment:
          err.response?.data?.message || "Payment failed. Please try again.",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancel = () => {
    setProviderModalVisible(false);
    setOrderModalVisible(false);
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
    <View style={styles.container}>
      <Text style={styles.header}>Nearby Service Providers</Text>

      <FlatList
        data={groupedOffers}
        keyExtractor={(item) => item.serviceProvider._id}
        renderItem={({ item, index }) => (
          <AnimatedReanimated.View
            entering={FadeInUp.delay(index * 100).springify()}
          >
            <TouchableOpacity
              style={styles.providerCard}
              onPress={() => {
                setSelectedProvider(item);
                setProviderModalVisible(true);
              }}
            >
              <View style={styles.providerHeader}>
                <View style={styles.avatarContainer}>
                  <Icon name="user-circle" size={40} color="#6200ea" />
                </View>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>
                    {item.serviceProvider.username}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color="#999" />
              </View>

              <View style={styles.providerDetails}>
                <View style={styles.detailRow}>
                  <Icon name="map-marker-alt" size={14} color="#666" />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {item.serviceProvider.shopAddress}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon name="phone" size={14} color="#666" />
                  <Text style={styles.detailText}>
                    {item.serviceProvider.phoneNo}
                  </Text>
                </View>
              </View>

              <View style={styles.offersPreview}>
                <Text style={styles.offersTitle}>
                  Available Offers: {item.offers.length}
                </Text>
              </View>
            </TouchableOpacity>
          </AnimatedReanimated.View>
        )}
      />

      {/* Provider Details Modal */}
      <Modal visible={providerModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Provider Details</Text>
              <TouchableOpacity onPress={() => setProviderModalVisible(false)}>
                <Icon name="times" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedProvider && (
              <ScrollView>
                <View style={styles.providerModalHeader}>
                  <Icon name="user-circle" size={60} color="#6200ea" />
                  <Text style={styles.providerModalName}>
                    {selectedProvider.serviceProvider.username}
                  </Text>
                </View>

                <View style={styles.providerModalDetails}>
                  <View style={styles.detailItem}>
                    <Icon name="map-marker-alt" size={18} color="#6200ea" />
                    <View>
                      <Text style={styles.detailLabel}>Address</Text>
                      <Text style={styles.detailValue}>
                        {selectedProvider.serviceProvider.shopAddress}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailItem}>
                    <Icon name="phone" size={18} color="#6200ea" />
                    <View>
                      <Text style={styles.detailLabel}>Phone</Text>
                      <Text style={styles.detailValue}>
                        {selectedProvider.serviceProvider.phoneNo}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Available Offers</Text>

                {selectedProvider.offers.map((offer) => (
                  <View key={offer._id} style={styles.offerCard}>
                    <View style={styles.offerHeader}>
                      <Text style={styles.offerTitle}>{offer.title}</Text>
                      {offer.discountPercentage > 0 && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>
                            {offer.discountPercentage}% OFF
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.offerDescription}>
                      {offer.description}
                    </Text>

                    <View style={styles.servicesList}>
                      {offer.servicesIncluded.map((service, i) => (
                        <View key={i} style={styles.serviceItem}>
                          <Text style={styles.serviceName}>{service.name}</Text>
                          <Text style={styles.servicePrice}>
                            PKR:
                            {service.price -
                              (service.price * offer.discountPercentage) / 100}
                            {offer.discountPercentage > 0 && (
                              <Text style={styles.originalPrice}>
                                {" "}
                                PKR: {service.price}
                              </Text>
                            )}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => {
                        setSelectedOffer({
                          ...offer,
                          providerId: selectedProvider.serviceProvider._id,
                        });
                        setQuantities(
                          offer.servicesIncluded.reduce(
                            (acc, service) => ({
                              ...acc,
                              [service.name]: 1,
                            }),
                            {}
                          )
                        );
                        setProviderModalVisible(false);
                        setOrderModalVisible(true);
                      }}
                    >
                      <Text style={styles.selectButtonText}>
                        Select This Offer
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Order Modal */}
      <Modal visible={orderModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={handleCancel}>
                <Icon name="times" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.sectionTitle}>Your Information</Text>

              <View style={styles.inputContainer}>
                <Icon
                  name="map-marker-alt"
                  size={16}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Delivery Address"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
              {errors.address && (
                <Text style={styles.errorText}>{errors.address}</Text>
              )}

              <View style={styles.inputContainer}>
                <Icon
                  name="phone"
                  size={16}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}

              <View style={styles.inputContainer}>
                <Icon
                  name="envelope"
                  size={16}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}

              <Text style={styles.sectionTitle}>Selected Services</Text>

              {selectedOffer?.servicesIncluded.map((service, i) => (
                <View key={i} style={styles.serviceSelectionRow}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.servicePrice}>
                      PKR:
                      {service.price -
                        (service.price * selectedOffer.discountPercentage) /
                          100}
                    </Text>
                  </View>

                  <View style={styles.quantityContainer}>
                    <TouchableOpacity
                      onPress={() => handleQuantityChange(service.name, -1)}
                    >
                      <Icon name="minus-circle" size={24} color="#6200ea" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>
                      {quantities[service.name]}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleQuantityChange(service.name, 1)}
                    >
                      <Icon name="plus-circle" size={24} color="#6200ea" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      toggleService(service, selectedOffer.discountPercentage)
                    }
                    style={[
                      styles.selectButtonSmall,
                      selectedServices.some((s) => s.name === service.name) &&
                        styles.selectedButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectButtonTextSmall,
                        selectedServices.some((s) => s.name === service.name) &&
                          styles.selectedButtonText,
                      ]}
                    >
                      {selectedServices.some((s) => s.name === service.name)
                        ? "Selected"
                        : "Select"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalAmount}>PKR: {calculateTotal()}</Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.payButton} onPress={handlePay}>
                  <Text style={styles.payButtonText}>Proceed to Payment</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <Animated.View
          style={[
            styles.paymentContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.paymentScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.paymentHeader}>
              <Text style={styles.paymentTitle}>Payment Details</Text>
              <TouchableOpacity onPress={handleCancel}>
                <Icon name="times" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentContent}>
              <Text style={styles.paymentAmount}>
                Total: PKR {calculateTotal()}
              </Text>

              <CardField
                postalCodeEnabled={false}
                placeholder={{ number: "4242 4242 4242 4242" }}
                cardStyle={styles.cardField}
                style={styles.cardContainer}
                onCardChange={(card) => setCardDetails(card)}
              />

              {errors.payment && (
                <Text style={styles.errorText}>{errors.payment}</Text>
              )}

              <View style={styles.paymentButtons}>
                <TouchableOpacity
                  style={styles.cancelPaymentButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelPaymentButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmPaymentButton,
                    paymentLoading && styles.disabledButton,
                  ]}
                  onPress={handlePaymentConfirm}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmPaymentButtonText}>
                      Confirm Payment
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    marginTop: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 16,
    color: "#333",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginLeft: 20,
  },
  providerCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#333",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  providerDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  offersPreview: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  offersTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6200ea",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 16,
    maxHeight: "80%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  providerModalHeader: {
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  providerModalName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 12,
    marginBottom: 4,
  },
  providerModalDetails: {
    padding: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    margin: 16,
    marginBottom: 12,
  },
  offerCard: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  offerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  discountBadge: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  offerDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  servicesList: {
    marginBottom: 16,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  serviceName: {
    fontSize: 14,
    color: "#333",
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  originalPrice: {
    fontSize: 12,
    color: "#999",
    textDecorationLine: "line-through",
  },
  selectButton: {
    backgroundColor: "#6200ea",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  selectButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  serviceSelectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  serviceInfo: {
    flex: 1,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
  },
  quantityText: {
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: "bold",
  },
  selectButtonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#6200ea",
  },
  selectedButton: {
    backgroundColor: "#6200ea",
  },
  selectButtonTextSmall: {
    color: "#6200ea",
    fontSize: 12,
  },
  selectedButtonText: {
    color: "#fff",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6200ea",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 0,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f1f1f1",
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "bold",
    fontSize: 16,
  },
  payButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#6200ea",
    marginLeft: 8,
    alignItems: "center",
  },
  payButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  paymentContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  paymentContent: {
    padding: 16,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#333",
  },
  cardField: {
    backgroundColor: "#efefef",
    borderRadius: 8,
    height: 50,
  },
  cardContainer: {
    height: 50,
    marginVertical: 10,
  },
  paymentButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelPaymentButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f1f1f1",
    marginRight: 8,
    alignItems: "center",
  },
  cancelPaymentButtonText: {
    color: "#666",
    fontWeight: "bold",
    fontSize: 16,
  },
  confirmPaymentButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#6200ea",
    marginLeft: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  confirmPaymentButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default Explore;
