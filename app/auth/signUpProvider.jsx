// ✅ UPDATED COMPONENT
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
  Image,
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
import axios from "axios";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Location from "expo-location";
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from "../../baseURL";

const { width } = Dimensions.get("window");

const signUpSchema = z.object({
  username: z.string().min(1, "Business Name is required"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain at least one letter, one number, and one special character"),
  phoneNo: z
    .string()
    .min(1, "Phone Number is required")
    .regex(/^\d{11}$/, "Phone number must be exactly 11 digits"),
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
  const [profilePic, setProfilePic] = useState(null);

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

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setServicesLoading(true);
        const response = await axios.get(`${API_URL}/services/getAll`);
        setAllServices(Array.isArray(response.data.data) ? response.data.data : []);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch services. Please try again.");
      } finally {
        setServicesLoading(false);
      }
    };
    fetchServices();
  }, []);

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

  const toggleMenu = () => setMenuVisible((prev) => !prev);

  const pickImage = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library to select a business logo.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePic(result.assets[0]);
      }
    } catch (error) {
("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', data.username);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('phoneNo', data.phoneNo);
      formData.append('shopAddress', data.shopAddress);
      formData.append('currentLocation', JSON.stringify(data.currentLocation));
      formData.append('services', JSON.stringify(data.services));
      
      if (profilePic) {
        formData.append('profilePic', {
          uri: profilePic.uri,
          type: 'image/jpeg',
          name: 'profilePic.jpg',
        });
      }

      const response = await axios.post(
        `${API_URL}/users/register/provider`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.status === 201) {
        Alert.alert("Success", "Provider registered successfully! Please wait for admin approval.");
        router.push("/auth/login");
      } else {
        Alert.alert("Error", "Failed to register. Please try again.");
      }
    } catch (error) {
("Provider registration error:", error);
      Alert.alert("Error", "Something went wrong. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  const selectedServices = watch("services");

  return (
    <PaperProvider>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Join as a Provider</Text>
              <Text style={styles.headerSubtitle}>Create your business account</Text>
            </View>

            {/* Profile Picture Selection */}
            <View style={styles.profilePicContainer}>
              <Text style={styles.label}>Business Logo (Optional)</Text>
              <View style={styles.profilePicWrapper}>
                <TouchableOpacity style={styles.profilePicButton} onPress={pickImage}>
                  {profilePic ? (
                    <View style={styles.profilePicContainer}>
                      <Image source={{ uri: profilePic.uri }} style={styles.profilePic} />
                      <TouchableOpacity 
                        style={styles.removePicButton} 
                        onPress={() => setProfilePic(null)}
                      >
                        <IconButton icon="close" size={16} iconColor="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.profilePicPlaceholder}>
                      <IconButton icon="camera-plus" size={32} iconColor="#8A63D2" />
                      <Text style={styles.profilePicText}>Add Logo</Text>
                      <Text style={styles.profilePicSubtext}>Tap to select</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Business Name */}
            <InputField control={control} name="username" label="Business Name" placeholder="Enter Business Name" error={errors.username?.message} />
            <InputField control={control} name="email" label="Email" placeholder="Enter Email" keyboardType="email-address" error={errors.email?.message} />
            <InputField
              control={control}
              name="password"
              label="Password"
              placeholder="Enter Password"
              secureTextEntry={secureText}
              rightIcon={() => (
                <TextInput.Icon
                  icon={secureText ? "eye-off" : "eye"}
                  onPress={() => setSecureText(!secureText)}
                  iconColor="#6B7280"
                />
              )}
              error={errors.password?.message}
            />
            <InputField control={control} name="phoneNo" label="Phone Number" placeholder="Enter Phone Number" keyboardType="phone-pad" error={errors.phoneNo?.message} />

            {/* Services Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Services</Text>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <TouchableOpacity style={styles.dropdownButton} onPress={toggleMenu}>
                    <Text style={styles.dropdownText}>
                      {servicesLoading
                        ? "Loading services..."
                        : selectedServices.length > 0
                        ? `Selected: ${selectedServices.length}`
                        : "Choose Services"}
                    </Text>
                    <Ionicons name={menuVisible ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                  </TouchableOpacity>
                }
              >
                {servicesLoading ? (
                  <Menu.Item title="Loading..." disabled />
                ) : allServices.length > 0 ? (
                  allServices.map((service) => (
                    <Menu.Item key={service._id} onPress={() => handleSelectService(service)} title={service.name} />
                  ))
                ) : (
                  <Menu.Item title="No services available" disabled />
                )}
              </Menu>
              {errors.services && <Text style={styles.errorText}>{errors.services.message}</Text>}
            </View>

            {selectedServices.length > 0 && (
              <View style={styles.serviceTagsContainer}>
                {selectedServices.map((id) => {
                  const service = allServices.find((s) => s._id === id);
                  return (
                    <View key={id} style={styles.serviceTag}>
                      <Text style={styles.serviceTagText}>{service?.name || "Unknown"}</Text>
                      <TouchableOpacity onPress={() => removeService(id)}>
                        <Ionicons name="close-circle" size={18} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            <InputField control={control} name="shopAddress" label="Shop Address" placeholder="Enter Shop Address" multiline error={errors.shopAddress?.message} />

            {/* ✅ FULL-WIDTH BUTTONS */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.signUpButton, loading && styles.disabledButton]} onPress={handleSubmit(onSubmit)} disabled={loading}>
                <LinearGradient colors={["#8A63D2", "#A78BFA"]} style={styles.signUpButtonGradient}>
                  {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.signUpButtonText}>Sign Up as Provider</Text>}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginButton} onPress={() => router.push("/auth/login")}>
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>

              {/* Go to Home Button */}
              <TouchableOpacity style={styles.homeButton} onPress={() => router.push("/")}>
                <Text style={styles.homeButtonText}>Go to Home</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PaperProvider>
  );
};

const InputField = ({ control, name, label, placeholder, keyboardType, secureTextEntry, multiline, rightIcon, error }) => (
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
  scrollContent: { flexGrow: 1, padding: 16, alignItems: "center" },
  card: { width: width > 500 ? 450 : "100%", backgroundColor: "#FFF", borderRadius: 12, padding: 24, elevation: 3 },
  header: { alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#1F2937" },
  headerSubtitle: { fontSize: 16, color: "#6B7280", marginTop: 4 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#1F2937", marginBottom: 8 },
  input: { backgroundColor: "#FFF", borderRadius: 8, fontSize: 16 },
  dropdownButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, backgroundColor: "#FFF" },
  dropdownText: { fontSize: 16, color: "#1F2937" },
  serviceTagsContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 8, gap: 8 },
  serviceTag: { flexDirection: "row", alignItems: "center", backgroundColor: "#8A63D2", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  serviceTagText: { fontSize: 14, color: "#FFF", marginRight: 8 },
  errorText: { fontSize: 14, color: "#EF4444", marginTop: 4 },
  profilePicContainer: { alignItems: "center", marginBottom: 20 },
  profilePicWrapper: { alignItems: "center", justifyContent: "center" },
  profilePicButton: { alignItems: "center", justifyContent: "center" },
  profilePic: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: "#8A63D2" },
  profilePicPlaceholder: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: "#F8FAFC", 
    borderWidth: 2, 
    borderColor: "#E2E8F0", 
    borderStyle: "dashed", 
    justifyContent: "center", 
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profilePicText: { color: "#8A63D2", fontSize: 14, fontWeight: "600", marginTop: 6 },
  profilePicSubtext: { color: "#94A3B8", fontSize: 11, marginTop: 2 },
  removePicButton: { 
    position: "absolute", 
    top: -8, 
    right: -8, 
    backgroundColor: "#FF6B6B", 
    borderRadius: 18, 
    width: 36, 
    height: 36, 
    justifyContent: "center", 
    alignItems: "center", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 3.84, 
    elevation: 5,
    borderWidth: 2,
    borderColor: "#fff",
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 12,
    marginTop: 24,
  },
  signUpButton: { width: "100%", borderRadius: 8, overflow: "hidden" },
  disabledButton: { opacity: 0.6 },
  signUpButtonGradient: { padding: 16, alignItems: "center", justifyContent: "center" },
  signUpButtonText: { fontSize: 16, fontWeight: "600", color: "#FFF" },
  loginButton: { width: "100%", borderRadius: 8, borderWidth: 1, borderColor: "#8A63D2", padding: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF" },
  loginButtonText: { fontSize: 16, fontWeight: "600", color: "#8A63D2" },
  homeButton: { width: "100%", borderRadius: 8, padding: 12, alignItems: "center", justifyContent: "center", backgroundColor: "transparent", marginTop: 8 },
  homeButtonText: { fontSize: 14, fontWeight: "500", color: "#6B7280" },
});

export default SignUpProvider;
