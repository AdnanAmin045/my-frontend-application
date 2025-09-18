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

const ProviderPayments = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [adminPaymentHistory, setAdminPaymentHistory] = useState([]);
  const [summary, setSummary] = useState({ totalEarned: 0, pendingAmount: 0 });
  const [editingMethod, setEditingMethod] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    paymentMethod: "easypaisa",
    accountTitle: "",
    accountNumber: "",
    bankName: ""
  });

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

      // Fetch payment method
      const methodResponse = await axios.get(`${API_URL}/payments/provider/method`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch payment history
      const historyResponse = await axios.get(`${API_URL}/payments/provider/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch admin payment history
      const adminHistoryResponse = await axios.get(`${API_URL}/payments/provider/admin-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Payment method response:", methodResponse.data);
      setPaymentMethod(methodResponse.data.data);
      setPaymentHistory(historyResponse.data.data.payments);
      setAdminPaymentHistory(adminHistoryResponse.data.data.payments);
      setSummary(historyResponse.data.data.summary);

    } catch (error) {
      console.error("Error fetching payment data:", error);
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

  const handleEditMethod = () => {
    console.log("🔍 Opening edit modal with current paymentMethod:", paymentMethod);
    
    const newFormData = {
      paymentMethod: paymentMethod?.paymentMethod || "easypaisa",
      accountTitle: paymentMethod?.paymentDetails?.accountTitle || "",
      accountNumber: paymentMethod?.paymentDetails?.accountNumber || "",
      bankName: paymentMethod?.paymentDetails?.bankName || ""
    };
    
    console.log("🔍 Setting form data to:", newFormData);
    setFormData(newFormData);
    setEditModalVisible(true);
  };

  const handleSaveMethod = async () => {
    setSaving(true);
    try {
      const userData = await AsyncStorage.getItem("user");
      const parsedUser = JSON.parse(userData);
      const token = parsedUser.accessToken;

      console.log("Saving payment method with data:", formData);

      // Prepare the data in the format expected by backend
      const requestData = {
        paymentMethod: formData.paymentMethod,
        paymentDetails: {
          accountTitle: formData.accountTitle,
          accountNumber: formData.accountNumber,
          bankName: formData.bankName
        }
      };

      console.log("Request data being sent:", requestData);

      const response = await axios.put(`${API_URL}/payments/provider/method`, requestData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Payment method save response:", response.data);
      setPaymentMethod(response.data.data);
      setEditModalVisible(false);
      Alert.alert("Success", "Payment method updated successfully!");
    } catch (error) {
      console.error("Error updating payment method:", error);
      console.error("Error response:", error.response?.data);
      Alert.alert("Error", "Failed to update payment method");
    } finally {
      setSaving(false);
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
      case "paid": return "#2ECC71";
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
          <Text style={styles.headerSubtitle}>Manage your payment methods and track earnings</Text>
        </LinearGradient>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <MaterialIcons name="account-balance-wallet" size={24} color="#2ECC71" />
            <Text style={styles.summaryLabel}>Total Earned</Text>
            <Text style={styles.summaryValue}>PKR {summary.totalEarned.toLocaleString()}</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <MaterialIcons name="schedule" size={24} color="#F39C12" />
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValue}>PKR {summary.pendingAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <TouchableOpacity onPress={handleEditMethod} style={styles.editButton}>
              <MaterialIcons name="edit" size={20} color="#8A63D2" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.methodCard}>
            {paymentMethod?.paymentMethod ? (
              <>
                <View style={styles.methodHeader}>
                  <FontAwesome5 name={getPaymentMethodIcon(paymentMethod.paymentMethod)} size={24} color="#8A63D2" />
                  <Text style={styles.methodName}>{getPaymentMethodName(paymentMethod.paymentMethod)}</Text>
                </View>

                <View style={styles.methodDetails}>
                  {paymentMethod?.paymentDetails && (
                    <>
                      {paymentMethod.paymentDetails.accountTitle && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Account Title:</Text>
                          <Text style={styles.detailValue}>{paymentMethod.paymentDetails.accountTitle}</Text>
                        </View>
                      )}
                      {paymentMethod.paymentDetails.accountNumber && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Account Number:</Text>
                          <Text style={styles.detailValue}>{paymentMethod.paymentDetails.accountNumber}</Text>
                        </View>
                      )}
                      {paymentMethod.paymentDetails.bankName && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Bank Name:</Text>
                          <Text style={styles.detailValue}>{paymentMethod.paymentDetails.bankName}</Text>
                        </View>
                      )}
                    </>
                  )}
                  
                  {(!paymentMethod?.paymentDetails || 
                    (!paymentMethod.paymentDetails.accountTitle && 
                     !paymentMethod.paymentDetails.accountNumber && 
                     !paymentMethod.paymentDetails.bankName)) && (
                    <View style={styles.noDetailsContainer}>
                      <Text style={styles.noDetailsText}>No payment method added</Text>
                      <Text style={styles.noDetailsSubtext}>Add payment details to receive payments</Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.noMethodContainer}>
                <MaterialIcons name="payment" size={40} color="#999" />
                <Text style={styles.noMethodText}>No payment method added</Text>
                <Text style={styles.noMethodSubtext}>Add a payment method to receive payments</Text>
              </View>
            )}
          </View>
        </View>

        {/* Admin Payment History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Payments Received</Text>
          
          {adminPaymentHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="admin-panel-settings" size={50} color="#999" />
              <Text style={styles.emptyText}>No admin payments yet</Text>
              <Text style={styles.emptySubtext}>Payments from admin will appear here</Text>
            </View>
          ) : (
            adminPaymentHistory.map((payment, index) => (
              <View key={index} style={styles.adminPaymentCard}>
                <View style={styles.paymentHeader}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.paymentAmount}>PKR {payment.amount.toLocaleString()}</Text>
                    <Text style={styles.paymentOrder}>From: Admin</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: "#2ECC71" }]}>
                    <Text style={styles.statusText}>RECEIVED</Text>
                  </View>
                </View>
                
                <View style={styles.paymentDetails}>
                  <Text style={styles.paymentDate}>{formatDate(payment.createdAt)}</Text>
                  <Text style={styles.paymentMethod}>Method: {getPaymentMethodName(payment.paymentMethod)}</Text>
                  {payment.notes && (
                    <Text style={styles.paymentNotes}>Notes: {payment.notes}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Payment Method Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {saving ? "Saving Payment Method..." : "Edit Payment Method"}
              </Text>
              <TouchableOpacity 
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
              >
                <MaterialIcons name="close" size={24} color={saving ? "#9CA3AF" : "#666"} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Payment Method</Text>
                <View style={styles.methodOptions}>
                  {["easypaisa", "jazzcash", "bank_transfer"].map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.methodOption,
                        formData.paymentMethod === method && styles.methodOptionSelected,
                        saving && styles.methodOptionDisabled
                      ]}
                      onPress={() => setFormData({ ...formData, paymentMethod: method })}
                      disabled={saving}
                    >
                      <FontAwesome5 name={getPaymentMethodIcon(method)} size={16} color={formData.paymentMethod === method ? "#fff" : "#666"} />
                      <Text style={[
                        styles.methodOptionText,
                        formData.paymentMethod === method && styles.methodOptionTextSelected
                      ]}>
                        {getPaymentMethodName(method)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Title</Text>
                <TextInput
                  style={[styles.input, saving && styles.inputDisabled]}
                  value={formData.accountTitle}
                  onChangeText={(text) => setFormData({ ...formData, accountTitle: text })}
                  placeholder="Enter account title"
                  editable={!saving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput
                  style={[styles.input, saving && styles.inputDisabled]}
                  value={formData.accountNumber}
                  onChangeText={(text) => setFormData({ ...formData, accountNumber: text })}
                  placeholder="Enter account number"
                  keyboardType="numeric"
                  editable={!saving}
                />
              </View>

              {formData.paymentMethod === "bank_transfer" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bank Name</Text>
                  <TextInput
                    style={[styles.input, saving && styles.inputDisabled]}
                    value={formData.bankName}
                    onChangeText={(text) => setFormData({ ...formData, bankName: text })}
                    placeholder="Enter bank name"
                    editable={!saving}
                  />
                </View>
              )}

            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, saving && styles.cancelButtonDisabled]}
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
              >
                <Text style={[styles.cancelButtonText, saving && styles.cancelButtonTextDisabled]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveMethod}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
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
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#8A63D2',
    fontWeight: '600',
  },
  methodCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  methodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  methodDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
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
  paymentCard: {
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
  adminPaymentCard: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8A63D2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  paymentOrder: {
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
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  paymentCustomer: {
    fontSize: 12,
    color: '#6B7280',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  paymentNotes: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
  methodOptionDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.7,
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
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.7,
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
    borderColor: '#9CA3AF',
    opacity: 0.7,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  cancelButtonTextDisabled: {
    color: '#9CA3AF',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#8A63D2',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  noMethodContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  noMethodText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  noMethodSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  noDetailsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  noDetailsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  noDetailsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default ProviderPayments;
