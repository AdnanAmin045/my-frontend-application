import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { API_URL } from "../../baseURL";

const AdminPayments = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [providers, setProviders] = useState([]);
  const [allProviders, setAllProviders] = useState([]); // Store all providers for search
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [summary, setSummary] = useState({ totalPaid: 0 });
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "easypaisa",
    notes: ""
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const fetchPaymentData = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (!userData) {
        Alert.alert("Error", "No user data found");
        return;
      }
      const parsedUser = JSON.parse(userData);
      const token = parsedUser.accessToken;

      if (!token) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      // Fetch providers payment summary
      const providersResponse = await axios.get(`${API_URL}/payments/admin/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch admin payment history
      const historyResponse = await axios.get(`${API_URL}/payments/admin/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const providersData = providersResponse.data.data;
("🔍 Providers data:", providersData); // Debug logging
      setProviders(providersData);
      setAllProviders(providersData); // Store all providers for search
      setFilteredProviders(providersData); // Initially show all providers
      setPaymentHistory(historyResponse.data.data.payments);
      setSummary(historyResponse.data.data.summary);

    } catch (error) {
("Error fetching payment data:", error);
      Alert.alert("Error", "Failed to load payment data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPaymentData();
  }, [fetchPaymentData]);

  // Search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredProviders(allProviders);
    } else {
      const filtered = allProviders.filter(provider =>
        provider.username.toLowerCase().includes(query.toLowerCase()) ||
        provider.email.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProviders(filtered);
    }
  };

  const handleMakePayment = (provider) => {
    if (provider.balance <= 0) {
      Alert.alert("No Pending Payment", "This provider has no pending payment amount.");
      return;
    }
    
    // Check if provider has payment method configured
    if (!provider.paymentMethod || !provider.paymentDetails) {
      Alert.alert(
        "Payment Method Required", 
        "This provider has not configured their payment method yet. Please ask them to add their payment details in their dashboard before making a payment.",
        [
          { text: "OK", style: "default" }
        ]
      );
      return;
    }
    
    setSelectedProvider(provider);
    setPaymentForm({
      amount: "", // Let admin enter the amount they want to pay
      paymentMethod: provider.paymentMethod,
      notes: ""
    });
    setPaymentModalVisible(true);
  };

  const handleSubmitPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (amount > selectedProvider.balance) {
      Alert.alert("Error", `Amount cannot exceed pending payment of PKR ${selectedProvider.balance.toLocaleString()}`);
      return;
    }

    setIsProcessingPayment(true);
    try {
      const userData = await AsyncStorage.getItem("user");
      const parsedUser = JSON.parse(userData);
      const token = parsedUser.accessToken;

      const paymentData = {
        providerId: selectedProvider._id,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        paymentDetails: selectedProvider.paymentDetails,
        notes: paymentForm.notes
      };

("🔍 Sending payment data:", paymentData);
("🔍 API URL:", `${API_URL}/payments/admin/make-payment`);
("🔍 Token available:", !!token);

      await axios.post(`${API_URL}/payments/admin/make-payment`, paymentData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert("Success", "Payment made successfully!");
      setPaymentModalVisible(false);
      fetchPaymentData(); // Refresh data
    } catch (error) {
("❌ Error making payment:", error);
("❌ Error response:", error.response?.data);
("❌ Error status:", error.response?.status);
      const errorMessage = error.response?.data?.message || error.message || "Failed to make payment";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "easypaisa": return "mobile-alt";
      case "jazzcash": return "mobile-alt";
      case "bank_transfer": return "university";
      case "cash": return "money-bill-wave";
      default: return "credit-card";
    }
  };

  const getPaymentMethodName = (method) => {
    switch (method) {
      case "easypaisa": return "EasyPaisa";
      case "jazzcash": return "JazzCash";
      case "bank_transfer": return "Bank Transfer";
      case "cash": return "Cash";
      default: return method;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "#2ECC71";
      case "pending": return "#F39C12";
      case "cancelled": return "#E74C3C";
      default: return "#95A5A6";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A63D2" />
        <Text style={styles.loadingText}>Loading payment data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#8A63D2"]} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#8A63D2', '#A78BFA']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Payment Management</Text>
          <Text style={styles.headerSubtitle}>Manage provider payments and track transactions</Text>
        </LinearGradient>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <MaterialIcons name="account-balance-wallet" size={32} color="#2ECC71" />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Total Paid to Providers</Text>
            <Text style={styles.summaryValue}>PKR {summary.totalPaid.toLocaleString()}</Text>
          </View>
        </View>

        {/* Providers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Provider Payments</Text>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search providers by username or email..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch("")} style={styles.clearButton}>
                <MaterialIcons name="clear" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          
          {filteredProviders.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="people" size={50} color="#999" />
              <Text style={styles.emptyText}>No providers found</Text>
              <Text style={styles.emptySubtext}>Provider payment data will appear here</Text>
            </View>
          ) : (
            filteredProviders.map((provider, index) => {
(`🔍 Provider ${provider.username} balance:`, provider.balance); // Debug logging
              return (
              <View key={index} style={styles.providerCard}>
                <View style={styles.providerHeader}>
                  <View style={styles.providerInfo}>
                    <Text style={styles.providerName}>{provider.username}</Text>
                    <Text style={styles.providerEmail}>{provider.email}</Text>
                    {/* Payment Method Status Indicator */}
                    <View style={styles.paymentMethodStatus}>
                      {provider.paymentMethod && provider.paymentDetails ? (
                        <View style={styles.paymentMethodConfigured}>
                          <MaterialIcons name="check-circle" size={16} color="#27AE60" />
                          <Text style={styles.paymentMethodText}>
                            {getPaymentMethodName(provider.paymentMethod)} configured
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.paymentMethodNotConfigured}>
                          <MaterialIcons name="warning" size={16} color="#E74C3C" />
                          <Text style={styles.paymentMethodText}>
                            Payment method not configured
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <FontAwesome5 
                    name={getPaymentMethodIcon(provider.paymentMethod)} 
                    size={20} 
                    color={provider.paymentMethod ? "#8A63D2" : "#BDC3C7"} 
                  />
                </View>

                <View style={styles.paymentSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Earned:</Text>
                    <Text style={styles.summaryValue}>PKR {provider.totalEarned.toLocaleString()}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Paid by Admin:</Text>
                    <Text style={styles.summaryValue}>PKR {provider.totalPaidByAdmin.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.balanceRow]}>
                    <Text style={styles.balanceLabel}>Pending Payment:</Text>
                    <Text style={[
                      styles.balanceValue,
                      { color: provider.balance > 0 ? "#F39C12" : "#95A5A6" }
                    ]}>
                      PKR {provider.balance.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Payment button - disabled if no payment method or no balance */}
                <TouchableOpacity
                  style={[
                    styles.payButton, 
                    (provider.balance <= 0 || !provider.paymentMethod || !provider.paymentDetails) && styles.payButtonDisabled,
                    isProcessingPayment && selectedProvider?._id === provider._id && styles.payButtonProcessing
                  ]}
                  onPress={() => handleMakePayment(provider)}
                  disabled={isProcessingPayment || !provider.paymentMethod || !provider.paymentDetails}
                >
                  {isProcessingPayment && selectedProvider?._id === provider._id ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.payButtonText}>Processing...</Text>
                    </>
                  ) : (
                    <>
                      <MaterialIcons name="payment" size={20} color="#fff" />
                      <Text style={styles.payButtonText}>
                        {provider.balance > 0 ? "Pay Pending Amount" : "No Pending Payment"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                
                {/* Show balance info */}
                <Text style={styles.balanceInfo}>
                  Pending Payment: PKR {provider.balance.toLocaleString()} 
                  {provider.balance <= 0 && " (No pending payment)"}
                </Text>

                <View style={styles.paymentDetails}>
                  <Text style={styles.detailsTitle}>Payment Method: {getPaymentMethodName(provider.paymentMethod)}</Text>
                  {provider.paymentDetails && (
                    <>
                      {provider.paymentDetails.accountTitle && (
                        <Text style={styles.detailText}>• Account Title: {provider.paymentDetails.accountTitle}</Text>
                      )}
                      {provider.paymentDetails.accountNumber && (
                        <Text style={styles.detailText}>• Account Number: {provider.paymentDetails.accountNumber}</Text>
                      )}
                      {provider.paymentDetails.bankName && (
                        <Text style={styles.detailText}>• Bank Name: {provider.paymentDetails.bankName}</Text>
                      )}
                    </>
                  )}
                  {(!provider.paymentDetails || 
                    (!provider.paymentDetails.accountTitle && 
                     !provider.paymentDetails.accountNumber && 
                     !provider.paymentDetails.bankName)) && (
                    <Text style={styles.noDetailsText}>No payment details added</Text>
                  )}
                </View>
              </View>
              );
            })
          )}
        </View>

        {/* Payment History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          
          {paymentHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="history" size={50} color="#999" />
              <Text style={styles.emptyText}>No payment history yet</Text>
              <Text style={styles.emptySubtext}>Admin payments will appear here</Text>
            </View>
          ) : (
            paymentHistory.map((payment, index) => (
              <View key={index} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyAmount}>PKR {payment.amount.toLocaleString()}</Text>
                    <Text style={styles.historyProvider}>{payment.providerId?.username}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                    <Text style={styles.statusText}>{payment.status.toUpperCase()}</Text>
                  </View>
                </View>
                
                <View style={styles.historyDetails}>
                  <Text style={styles.historyDate}>{formatDate(payment.createdAt)}</Text>
                  <Text style={styles.historyMethod}>{getPaymentMethodName(payment.paymentMethod)}</Text>
                </View>
                
                {payment.notes && (
                  <Text style={styles.historyNotes}>Notes: {payment.notes}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Make Payment Modal */}
      <Modal visible={paymentModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make Payment</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{selectedProvider?.username}</Text>
                <Text style={styles.providerEmail}>{selectedProvider?.email}</Text>
                <Text style={styles.balanceText}>Pending Payment: PKR {selectedProvider?.balance.toLocaleString()}</Text>
                <Text style={styles.paymentMethodText}>Payment Method: {getPaymentMethodName(selectedProvider?.paymentMethod)}</Text>
                {selectedProvider?.paymentDetails && (
                  <View style={styles.modalPaymentDetails}>
                    {selectedProvider.paymentDetails.accountTitle && (
                      <Text style={styles.modalDetailText}>Account: {selectedProvider.paymentDetails.accountTitle}</Text>
                    )}
                    {selectedProvider.paymentDetails.accountNumber && (
                      <Text style={styles.modalDetailText}>Number: {selectedProvider.paymentDetails.accountNumber}</Text>
                    )}
                    {selectedProvider.paymentDetails.bankName && (
                      <Text style={styles.modalDetailText}>Bank: {selectedProvider.paymentDetails.bankName}</Text>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (PKR)</Text>
                <TextInput
                  style={styles.input}
                  value={paymentForm.amount}
                  onChangeText={(text) => setPaymentForm({ ...paymentForm, amount: text })}
                  placeholder={`Enter amount (Max: PKR ${selectedProvider?.balance.toLocaleString()})`}
                  keyboardType="numeric"
                />
                <Text style={styles.inputHelper}>
                  Pending Payment: PKR {selectedProvider?.balance.toLocaleString()}
                </Text>
                <TouchableOpacity 
                  style={styles.fullBalanceButton}
                  onPress={() => setPaymentForm({ ...paymentForm, amount: selectedProvider?.balance.toString() })}
                >
                  <Text style={styles.fullBalanceButtonText}>Pay Full Pending Amount</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Method</Text>
                <View style={styles.methodOptions}>
                  {["easypaisa", "jazzcash", "bank_transfer"].map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.methodOption,
                        paymentForm.paymentMethod === method && styles.methodOptionSelected
                      ]}
                      onPress={() => setPaymentForm({ ...paymentForm, paymentMethod: method })}
                    >
                      <FontAwesome5 name={getPaymentMethodIcon(method)} size={16} color={paymentForm.paymentMethod === method ? "#fff" : "#666"} />
                      <Text style={[
                        styles.methodOptionText,
                        paymentForm.paymentMethod === method && styles.methodOptionTextSelected
                      ]}>
                        {getPaymentMethodName(method)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={paymentForm.notes}
                  onChangeText={(text) => setPaymentForm({ ...paymentForm, notes: text })}
                  placeholder="Add any notes..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, isProcessingPayment && styles.cancelButtonDisabled]}
                onPress={() => setPaymentModalVisible(false)}
                disabled={isProcessingPayment}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, isProcessingPayment && styles.submitButtonDisabled]}
                onPress={handleSubmitPayment}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.submitButtonText}>Processing...</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="payment" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Make Payment</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  header: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryInfo: {
    marginLeft: 16,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  section: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  providerCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  providerEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  paymentSummary: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  balanceRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 8,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8A63D2',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payButtonProcessing: {
    backgroundColor: '#6B7280',
    opacity: 0.8,
  },
  balanceInfo: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  paymentDetails: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  noDetailsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A63D2',
    marginTop: 8,
  },
  modalPaymentDetails: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  modalDetailText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  historyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyInfo: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  historyProvider: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  historyMethod: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyNotes: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  providerInfo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  providerEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8A63D2',
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  methodOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  methodOptionSelected: {
    backgroundColor: '#8A63D2',
    borderColor: '#8A63D2',
  },
  methodOptionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6B7280',
  },
  methodOptionTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  inputHelper: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  fullBalanceButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  fullBalanceButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#8A63D2',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  paymentMethodStatus: {
    marginTop: 4,
  },
  paymentMethodConfigured: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodNotConfigured: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#6B7280',
  },
});

export default AdminPayments;
