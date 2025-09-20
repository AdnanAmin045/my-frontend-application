import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from "react-native";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import { API_URL } from "../../baseURL";
import { useRouter } from "expo-router";

// Zod schema
const offerSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(5, "Description is required"),
  discountPercentage: z.number().min(0, "Min 0%").max(100, "Max 100%"),
  servicesIncluded: z
    .array(
      z.object({
        _id: z.string().optional(),
        name: z.string(),
        price: z.number(),
      })
    )
    .min(1, "Select at least one service"),
});

export default function OffersScreen() {
  const router = useRouter();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [servicePrice, setServicePrice] = useState("");
  const [profileActive, setProfileActive] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      title: "",
      description: "",
      discountPercentage: 0,
      servicesIncluded: [],
    },
  });

  // ✅ Fetch Services
  const fetchServices = async () => {
    try {
      const token = await AsyncStorage.getItem("user");
      const accessToken = token ? JSON.parse(token).accessToken : null;
      if (!accessToken) {
        router.push("/auth/login");
        return;
      }
      const response = await axios.get(
        `${API_URL}/services/getServicesForProvider`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setServices(response.data.services || []);
    } catch (err) {
(
        "Error fetching services:",
        err.response?.data || err.message
      );
      setServices([]);
    }
  };

  // ✅ Fetch Offers
  const fetchOffers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("user");
      const accessToken = token ? JSON.parse(token).accessToken : null;
      if (!accessToken) {
        router.push("/auth/login");
        return;
      }

      const response = await axios.get(`${API_URL}/offers/getAll`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const offersData = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      setOffers(offersData);
    } catch (err) {
("Error fetching offers:", err.response?.data || err.message);
      Alert.alert("Error", "Failed to fetch offers");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch Profile Status
  const fetchProfileStatus = async () => {
    try {
      setProfileLoading(true);
      const token = await AsyncStorage.getItem("user");
      const accessToken = token ? JSON.parse(token).accessToken : null;
      if (!accessToken) {
        router.push("/auth/login");
        return;
      }
      const response = await axios.get(`${API_URL}/providers/getProfileStatus`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.data?.data?.isActive !== undefined) {
        setProfileActive(response.data.data.isActive);
      }
    } catch (err) {
(
        "Error fetching profile status:",
        err.response?.data || err.message
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const toggleProfileStatus = async () => {
    try {
      setProfileLoading(true);
      const token = await AsyncStorage.getItem("user");
      const accessToken = token ? JSON.parse(token).accessToken : null;
      if (!accessToken) {
        router.push("/auth/login");
        return;
      }
      const response = await axios.patch(
        `${API_URL}/offers/toggle-status`,
        { isActive: !profileActive },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.status === 200) {
        setProfileActive(!profileActive);
      }
    } catch (error) {
(error.response?.data || error.message);
      Alert.alert("Error", "Failed to update profile status");
    } finally {
      setProfileLoading(false);
    }
  };

  const getToggleProfileStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("user");
      const accessToken = token ? JSON.parse(token).accessToken : null;
      if (!accessToken) {
        router.push("/auth/login");
        return;
      }
      const res = await axios.get(
        `${API_URL}/offers/getProviderProfileStatus`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setProfileActive(res.data.status);
    } catch (error) {
("Error fetching profile status:", error);
    }
  };

  useEffect(() => {
    getToggleProfileStatus();
    fetchOffers();
    fetchServices();
    fetchProfileStatus();
  }, []);

  // ✅ Toggle Offer Active Status
  const toggleOfferStatus = async (id, currentStatus) => {
    try {
      const token = await AsyncStorage.getItem("user");
      const accessToken = token ? JSON.parse(token).accessToken : null;
      if (!accessToken) return;
      
      const response = await axios.patch(
        `${API_URL}/offers/toggle/${id}`,
        { isActive: !currentStatus },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200) {
        fetchOffers();
      }
    } catch (error) {
(
        "Error toggling offer:",
        error.response?.data || error.message
      );
      Alert.alert("Error", "Failed to toggle offer status");
    }
  };

  // ✅ Add Service to Offer - FIXED
const addService = () => {
  if (!selectedServiceId || servicePrice === "") {
    Alert.alert("Error", "Please select a service and enter a price");
    return;
  }

  const priceValue = Number(servicePrice);
  if (priceValue < 200) {
    Alert.alert("Price Error", "Price must be at least 200 PKR");
    return;
  }

  // Find the selected service object
  const selectedService = services.find((s) => s._id === selectedServiceId);
  if (!selectedService) return;

  const currentServices = watch("servicesIncluded");

  // Check if service already exists by ID
  if (currentServices.find((s) => s._id === selectedServiceId)) {
    Alert.alert("Error", "This service is already added");
    return;
  }

  const updatedServices = [
    ...currentServices,
    {
      _id: selectedService._id,
      name: selectedService.name,
      price: priceValue,
    },
  ];

  setValue("servicesIncluded", updatedServices);
  setSelectedServiceId(null);
  setServicePrice("");
};


  // ✅ Remove Service from Offer
  const removeService = (serviceId) => {
    const currentServices = watch("servicesIncluded");
    const updatedServices = currentServices.filter(s => s._id !== serviceId);
    setValue("servicesIncluded", updatedServices);
  };

  // ✅ Create New Offer
  const onSubmit = async (data) => {
    try {
      setModalLoading(true);
      const token = await AsyncStorage.getItem("user");
      const accessToken = token ? JSON.parse(token).accessToken : null;
      if (!accessToken) return;

      let response;
      if (editingOffer) {
        // Update existing offer
        response = await axios.put(`${API_URL}/offers/update/${editingOffer._id}`, data, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } else {
        // Create new offer
        response = await axios.post(`${API_URL}/offers/create`, data, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", editingOffer ? "Offer updated successfully" : "Offer created successfully");
        fetchOffers();
        reset();
        setVisible(false);
        setEditingOffer(null);
      }
    } catch (err) {
      console.log("Error saving offer:", err.response?.data || err.message);
      Alert.alert("Error", editingOffer ? "Failed to update offer" : "Failed to create offer");
    } finally {
      setModalLoading(false);
    }
  };

  // ✅ Edit Offer - Load data into form
  const editOffer = (offer) => {
    setEditingOffer(offer);
    setValue("title", offer.title);
    setValue("description", offer.description);
    setValue("discountPercentage", offer.discountPercentage);
    setValue("servicesIncluded", offer.servicesIncluded || []);
    setVisible(true);
  };

  // ✅ Delete Offer
  const deleteOffer = async (offerId) => {
    Alert.alert(
      "Delete Offer",
      "Are you sure you want to delete this offer?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("user");
              const accessToken = token ? JSON.parse(token).accessToken : null;
              if (!accessToken) return;

              const response = await axios.delete(`${API_URL}/offers/delete/${offerId}`, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });

              if (response.status === 200) {
                Alert.alert("Success", "Offer deleted successfully");
                fetchOffers();
              }
            } catch (err) {
              console.log("Error deleting offer:", err.response?.data || err.message);
              Alert.alert("Error", "Failed to delete offer");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5", padding: 10 }}>
      {/* Profile Active Toggle */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "white",
          padding: 12,
          borderRadius: 10,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600" }}>Profile Active</Text>
        {profileLoading ? (
          <ActivityIndicator size="small" />
        ) : (
          <Switch
            value={profileActive}
            onValueChange={toggleProfileStatus}
            thumbColor={profileActive ? "#6200ee" : "#ccc"}
            trackColor={{ true: "#bb86fc", false: "#e0e0e0" }}
          />
        )}
      </View>

      {/* Add Offer Button */}
      <TouchableOpacity
        style={{
          backgroundColor: "#6200ee",
          padding: 12,
          borderRadius: 8,
          marginBottom: 10,
        }}
        onPress={() => {
          setEditingOffer(null);
          reset();
          setVisible(true);
        }}
      >
        <Text
          style={{ color: "white", textAlign: "center", fontWeight: "600" }}
        >
          Add New Offer
        </Text>
      </TouchableOpacity>

      {/* Offers List */}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: "white",
                padding: 15,
                borderRadius: 12,
                marginVertical: 8,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3,
              }}
            >
              {/* Title + Toggle */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontWeight: "bold", fontSize: 18 }}>
                  {item.title}
                </Text>
                <Switch
                  value={item.isActive}
                  onValueChange={() =>
                    toggleOfferStatus(item._id, item.isActive)
                  }
                  thumbColor={item.isActive ? "#6200ee" : "#ccc"}
                  trackColor={{ true: "#bb86fc", false: "#e0e0e0" }}
                />
              </View>

              <Text style={{ marginVertical: 4, color: "#555" }}>
                {item.description}
              </Text>

              <Text
                style={{
                  color: item.discountPercentage > 0 ? "green" : "gray",
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                Discount: {item.discountPercentage}%
              </Text>

              {/* Services */}
              <View style={{ marginTop: 6 }}>
                {item.servicesIncluded?.length > 0 ? (
                  item.servicesIncluded.map((service, idx) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        backgroundColor: "#f0f0f0",
                        padding: 8,
                        borderRadius: 6,
                        marginBottom: 5,
                      }}
                    >
                      <Text style={{ fontWeight: "600" }}>{service.name}</Text>
                      <Text style={{ color: "#333" }}>PKR: {service.price}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: "gray", fontStyle: "italic" }}>
                    No services added
                  </Text>
                )}
              </View>

              {/* Action Buttons */}
              <View style={{ 
                flexDirection: "row", 
                justifyContent: "space-between", 
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: "#E5E7EB"
              }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: "#3B82F6",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 6,
                    flex: 1,
                    marginRight: 8,
                  }}
                  onPress={() => editOffer(item)}
                >
                  <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
                    Edit
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    backgroundColor: "#EF4444",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 6,
                    flex: 1,
                    marginLeft: 8,
                  }}
                  onPress={() => deleteOffer(item._id)}
                >
                  <Text style={{ color: "white", textAlign: "center", fontWeight: "600" }}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal for Creating Offer */}
      <Modal visible={visible} animationType="slide" transparent={true}>
        <ScrollView
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}
          contentContainerStyle={{ justifyContent: "center", flexGrow: 1 }}
        >
          <View
            style={{
              backgroundColor: "white",
              margin: 20,
              padding: 20,
              borderRadius: 10,
              elevation: 5,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}
            >
              {editingOffer ? "Edit Offer" : "Create New Offer"}
            </Text>

            {/* Note about delivery charges */}
            <View style={{
              backgroundColor: "#FFF3E0",
              padding: 12,
              borderRadius: 8,
              marginBottom: 15,
              borderLeftWidth: 4,
              borderLeftColor: "#FF6B35"
            }}>
              <Text style={{
                color: "#FF6B35",
                fontWeight: "600",
                fontSize: 14
              }}>
                📦 Note: If you want to include delivery charges, please include them in the price.
              </Text>
            </View>

            {/* Title */}
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <View>
                  <Text style={{ fontWeight: "600", marginBottom: 2 }}>
                    Title
                  </Text>
                  <TextInput
                    placeholder="Enter Title"
                    value={value}
                    onChangeText={onChange}
                    style={{
                      borderWidth: 1,
                      borderColor: "#ccc",
                      padding: 10,
                      marginBottom: 5,
                      borderRadius: 6,
                    }}
                  />
                  {errors.title && (
                    <Text style={{ color: "red" }}>{errors.title.message}</Text>
                  )}
                </View>
              )}
            />

            {/* Description */}
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <View>
                  <Text style={{ fontWeight: "600", marginBottom: 2 }}>
                    Description
                  </Text>
                  <TextInput
                    placeholder="Enter Description"
                    value={value}
                    onChangeText={onChange}
                    style={{
                      borderWidth: 1,
                      borderColor: "#ccc",
                      padding: 10,
                      marginBottom: 5,
                      borderRadius: 6,
                    }}
                  />
                  {errors.description && (
                    <Text style={{ color: "red" }}>
                      {errors.description.message}
                    </Text>
                  )}
                </View>
              )}
            />

            {/* Discount */}
            <Controller
              control={control}
              name="discountPercentage"
              render={({ field: { onChange, value } }) => (
                <View>
                  <Text style={{ fontWeight: "600", marginBottom: 2 }}>
                    Discount %
                  </Text>
                  <TextInput
                    placeholder="Enter Discount %"
                    value={value.toString()}
                    onChangeText={(text) => onChange(Number(text))}
                    keyboardType="numeric"
                    style={{
                      borderWidth: 1,
                      borderColor: "#ccc",
                      padding: 10,
                      marginBottom: 5,
                      borderRadius: 6,
                    }}
                  />
                  {errors.discountPercentage && (
                    <Text style={{ color: "red" }}>
                      {errors.discountPercentage.message}
                    </Text>
                  )}
                </View>
              )}
            />

            {/* Services Dropdown */}
            <Text style={{ fontWeight: "600", marginBottom: 2 }}>Select Service</Text>
            <View style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 6, marginBottom: 10 }}>
              <Picker
                selectedValue={selectedServiceId}
                onValueChange={(itemValue) => setSelectedServiceId(itemValue)}
              >
                <Picker.Item label="Select Service" value={null} />
                {Array.isArray(services) &&
                  services.map((s) => (
                    <Picker.Item key={s._id} label={s.name} value={s._id} />
                  ))}
              </Picker>
            </View>

            {/* Price input */}
            {selectedServiceId && (
              <>
                <Text style={{ fontWeight: "600", marginBottom: 2 }}>Price</Text>
                <TextInput
                  placeholder={`Enter price for ${services.find(s => s._id === selectedServiceId)?.name}`}
                  value={servicePrice}
                  onChangeText={setServicePrice}
                  keyboardType="numeric"
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    padding: 10,
                    marginBottom: 10,
                    borderRadius: 6,
                  }}
                />
              </>
            )}

            <TouchableOpacity
              style={{
                backgroundColor: "#03dac5",
                padding: 10,
                borderRadius: 6,
                marginBottom: 10,
              }}
              onPress={addService}
            >
              <Text style={{ color: "white", textAlign: "center" }}>
                Add Service
              </Text>
            </TouchableOpacity>

            {/* Display selected services */}
            <Text style={{ fontWeight: "600", marginBottom: 5 }}>Selected Services:</Text>
            {watch("servicesIncluded").length > 0 ? (
              watch("servicesIncluded").map((s, index) => (
                <View key={index} style={{ 
                  flexDirection: "row", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  backgroundColor: "#f0f0f0", 
                  padding: 8, 
                  borderRadius: 6, 
                  marginBottom: 5 
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600" }}>{s.name}</Text>
                    <Text style={{ color: "#333" }}>PKR: {s.price}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeService(s._id)}>
                    <Text style={{ color: "red", fontWeight: "bold" }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={{ color: "gray", fontStyle: "italic", marginBottom: 10 }}>
                No services added yet
              </Text>
            )}
            
            {errors.servicesIncluded && (
              <Text style={{ color: "red", marginBottom: 10 }}>
                {errors.servicesIncluded.message}
              </Text>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={{
                backgroundColor: "#6200ee",
                padding: 12,
                borderRadius: 8,
                marginTop: 10,
                opacity: modalLoading ? 0.7 : 1,
              }}
              onPress={handleSubmit(onSubmit)}
              disabled={modalLoading}
            >
              {modalLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{
                    color: "white",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
{editingOffer ? "Update Offer" : "Save Offer"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 10 }}
              onPress={() => {
                reset();
                setVisible(false);
                setEditingOffer(null);
              }}
              disabled={modalLoading}
            >
              <Text style={{ textAlign: "center", color: "red" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}