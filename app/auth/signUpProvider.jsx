import React, { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import {
  Text,
  TextInput,
  IconButton,
  ActivityIndicator,
  Menu,
  Provider as PaperProvider,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Location from "expo-location";
import { API_URL } from "../baseURL";

const { width } = Dimensions.get("window");

// ✅ Zod Schema
const signUpSchema = z.object({
  username: z.string().min(1, "Business Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phoneNo: z.string().min(1, "Phone Number is required"),
  currentLocation: z.object({
    type: z.literal("Point"),
    coordinates: z
      .tuple([z.number(), z.number()])
      .refine(
        ([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
        { message: "Invalid coordinates" }
      ),
  }),
  shopAddress: z.string().min(1, "Shop Address is required"),
  services: z.array(z.string()).min(1, "Select at least one service"),
});

const SignUpProvider = () => {
  const router = useRouter();
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      phoneNo: "",
      currentLocation: { type: "Point", coordinates: [0, 0] },
      shopAddress: "",
      services: [],
    },
  });

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        const response = await axios.get(`${API_URL}/services/getAll`);
        const services = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setAllServices(services);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch services. Please try again.");
      } finally {
        setServicesLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Auto location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Permission to access location was denied");
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setValue("currentLocation", {
          type: "Point",
          coordinates: [location.coords.longitude, location.coords.latitude],
        });
      } catch (error) {
        setLocationError("Failed to fetch location. Please try again.");
      }
    })();
  }, [setValue]);

  // Select / Remove service
  const handleSelectService = (service) => {
    const currentServices = getValues("services");
    if (!currentServices.includes(service._id)) {
      setValue("services", [...currentServices, service._id]);
    }
    setMenuVisible(false);
  };
  const removeService = (id) => {
    setValue(
      "services",
      getValues("services").filter((s) => s !== id)
    );
  };

  // Submit API
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/users/register/provider`,
        data
      );
      if (response.status === 201) {
        router.push("/Login");
      } else {
        Alert.alert("Error", "Failed to register. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  const selectedServices = watch("services");

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Animated.View entering={FadeInDown.duration(500)} style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Join as a Provider</Text>
                <Text style={styles.headerSubtitle}>Create your business account</Text>
              </View>

              {/* Business Name */}
              <InputField
                control={control}
                name="username"
                label="Business Name"
                placeholder="Enter Business Name"
                error={errors.username?.message}
              />

              {/* Email */}
              <InputField
                control={control}
                name="email"
                label="Email"
                placeholder="Enter Email"
                keyboardType="email-address"
                error={errors.email?.message}
              />

              {/* Password */}
              <InputField
                control={control}
                name="password"
                label="Password"
                placeholder="Enter Password"
                secureTextEntry={secureText}
                rightIcon={() => (
                  <IconButton
                    icon={secureText ? "eye-off" : "eye"}
                    onPress={() => setSecureText(!secureText)}
                    size={22}
                    iconColor="#6B7280"
                  />
                )}
                error={errors.password?.message}
              />

              {/* Phone */}
              <InputField
                control={control}
                name="phoneNo"
                label="Phone Number"
                placeholder="Enter Phone Number"
                keyboardType="phone-pad"
                error={errors.phoneNo?.message}
              />

              {/* Services Dropdown */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Select Services</Text>
                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setMenuVisible(true)}
                    >
                      <Text style={styles.dropdownText}>
                        {servicesLoading
                          ? "Loading services..."
                          : selectedServices.length > 0
                          ? `Selected: ${selectedServices.length}`
                          : "Choose Services"}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  }
                >
                  {servicesLoading ? (
                    <Menu.Item title="Loading..." disabled />
                  ) : allServices.length > 0 ? (
                    allServices.map((service) => (
                      <Menu.Item
                        key={service._id}
                        onPress={() => handleSelectService(service)}
                        title={service.name}
                      />
                    ))
                  ) : (
                    <Menu.Item title="No services available" disabled />
                  )}
                </Menu>
                {errors.services && (
                  <Text style={styles.errorText}>{errors.services.message}</Text>
                )}
              </View>

              {/* Selected Service Chips */}
              {selectedServices.length > 0 && (
                <View style={styles.serviceTagsContainer}>
                  {selectedServices.map((id) => {
                    const service = allServices.find((s) => s._id === id);
                    return (
                      <View key={id} style={styles.serviceTag}>
                        <Text style={styles.serviceTagText}>
                          {service?.name || "Unknown"}
                        </Text>
                        <TouchableOpacity onPress={() => removeService(id)}>
                          <Ionicons name="close-circle" size={18} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Shop Address */}
              <InputField
                control={control}
                name="shopAddress"
                label="Shop Address"
                placeholder="Enter Shop Address"
                multiline
                error={errors.shopAddress?.message}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.signUpButton, loading && styles.disabledButton]}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#8A63D2", "#A78BFA"]}
                  style={styles.signUpButtonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.signUpButtonText}>Sign Up as Provider</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperProvider>
  );
};

// ✅ Reusable Input Component
const InputField = ({
  control,
  name,
  label,
  placeholder,
  keyboardType,
  secureTextEntry,
  multiline,
  rightIcon,
  error,
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <TextInput
          mode="outlined"
          placeholder={placeholder}
          style={styles.input}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          right={rightIcon ? rightIcon() : null}
        />
      )}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16, alignItems: "center" },
  card: {
    width: width > 500 ? 450 : "100%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    elevation: 3,
  },
  header: { alignItems: "center", marginBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#1F2937" },
  headerSubtitle: { fontSize: 16, color: "#6B7280", marginTop: 4 },
  inputContainer: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: { backgroundColor: "#FFF", borderRadius: 8, fontSize: 16 },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#FFF",
  },
  dropdownText: { fontSize: 16, color: "#1F2937" },
  serviceTagsContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  serviceTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8A63D2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  serviceTagText: { fontSize: 14, color: "#FFF", marginRight: 6 },
  errorText: { fontSize: 14, color: "#EF4444", marginTop: 4 },
  signUpButton: { borderRadius: 8, marginTop: 20 },
  disabledButton: { opacity: 0.6 },
  signUpButtonGradient: { padding: 16, alignItems: "center" },
  signUpButtonText: { fontSize: 18, fontWeight: "700", color: "#FFF" },
});

export default SignUpProvider;
