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
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../baseURL";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const user = await AsyncStorage.getItem("user");
      const token = user ? JSON.parse(user).accessToken : null

      const response = await axios.get(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(response.data);
      setOrders(response.data.data || []);
    } catch (err) {
      console.error(err);
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
      <Text style={styles.totalPayment}>Total Payment: ${item.totalPayment.toFixed(2)}</Text>

      {/* Address */}
      <Text style={styles.address}>
        {item.address.homeAddress} | {item.address.phoneNo} | {item.address.email}
      </Text>

      {/* Services */}
      <Text style={styles.servicesLabel}>Services:</Text>
      {item.services.map((service, index) => (
        <View key={index} style={styles.serviceRow}>
          <Text style={styles.serviceName}>
            {service.name} x{service.quantity}
          </Text>
          <Text style={styles.servicePrice}>${service.price}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
  );
};

export default OrderHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    padding: 12,
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
});
