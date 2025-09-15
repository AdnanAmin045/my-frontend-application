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
} from "react-native";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import { API_URL } from "../../baseURL";

// Zod schema
const offerSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(5, "Description is required"),
  discountPercentage: z.number().min(0, "Min 0%").max(100, "Max 100%"),
  servicesIncluded: z
    .array(
      z.object({
        name: z.string(),
        price: z.number(),
      })
    )
    .min(1, "Select at least one service"),
});

export default function OffersScreen() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [servicePrice, setServicePrice] = useState("");

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
      const response = await axios.get(`${API_URL}/services/getAll`);
      const servicesData = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      setServices(servicesData);
    } catch (err) {
      console.log(
        "Error fetching services:",
        err.response?.data || err.message
      );
      setServices([]);
    }
  };

  // ✅ Fetch Offers
  const fetchOffers = async () => {
    try {
      const token = await AsyncStorage.getItem("user");
      const accessToken = token ? JSON.parse(token).accessToken : null;
      if (!accessToken) return;

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
      console.log("Error fetching offers:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchOffers();
    fetchServices();
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
      console.log(
        "Error toggling offer:",
        error.response?.data || error.message
      );
    }
  };

  // ✅ Add Service to Offer
  const addService = () => {
    if (!selectedService || servicePrice === "") return;
    const currentServices = watch("servicesIncluded");
    if (currentServices.find((s) => s.name === selectedService.name)) return;

    const updatedServices = [
      ...currentServices,
      { name: selectedService.name, price: Number(servicePrice) },
    ];
    setValue("servicesIncluded", updatedServices);
    setSelectedService(null);
    setServicePrice("");
  };

  // ✅ Create New Offer
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("user");
      const accessToken = token ? JSON.parse(token).accessToken : null;
      if (!accessToken) return;

      const response = await axios.post(`${API_URL}/offers/create`, data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 200 || response.status === 201) {
        fetchOffers();
        reset();
        setVisible(false);
      }
    } catch (err) {
      console.log("Error creating offer:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5", padding: 10 }}>
      {/* Add Offer Button */}
      <TouchableOpacity
        style={{
          backgroundColor: "#6200ee",
          padding: 12,
          borderRadius: 8,
          marginBottom: 10,
        }}
        onPress={() => setVisible(true)}
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
                      <Text style={{ color: "#333" }}>${service.price}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: "gray", fontStyle: "italic" }}>
                    No services added
                  </Text>
                )}
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
              Create New Offer
            </Text>

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
            <Picker
              selectedValue={selectedService}
              onValueChange={(itemValue) => setSelectedService(itemValue)}
            >
              <Picker.Item label="Select Service" value={null} />
              {Array.isArray(services) &&
                services.map((s) => (
                  <Picker.Item key={s._id} label={s.name} value={s} />
                ))}
            </Picker>

            {/* Price input */}
            {selectedService && (
              <TextInput
                placeholder={`Enter price for ${selectedService.name}`}
                value={servicePrice}
                onChangeText={setServicePrice}
                keyboardType="numeric"
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  padding: 10,
                  marginVertical: 5,
                  borderRadius: 6,
                }}
              />
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
            {watch("servicesIncluded").map((s, index) => (
              <Text key={index} style={{ marginBottom: 3 }}>
                {s.name} ($ {s.price})
              </Text>
            ))}
            {errors.servicesIncluded && (
              <Text style={{ color: "red" }}>
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
              }}
              onPress={handleSubmit(onSubmit)}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontWeight: "600",
                }}
              >
                Save Offer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 10 }}
              onPress={() => {
                reset();
                setVisible(false);
              }}
            >
              <Text style={{ textAlign: "center", color: "red" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}
