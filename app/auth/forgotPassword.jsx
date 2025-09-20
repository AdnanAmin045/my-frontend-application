import React, { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StyleSheet,
  ScrollView,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Snackbar,
} from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { API_URL } from "../../baseURL";

const { width } = Dimensions.get("window");

// Zod validation schema for email
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

const ForgotPassword = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("customer");
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const showSnackbar = (message, type = "success") => {
    setSnackbar({ visible: true, message, type });
  };

  const onSubmit = async (data) => {
    // Validate role selection
    if (!role) {
      showSnackbar("Please select a role", "error");
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = { ...data, role };
      const response = await axios.post(`${API_URL}/users/forgot-password`, payload, { timeout: 10000 });
      
      if (response.status === 200) {
        showSnackbar("OTP sent to your email!", "success");
        // Navigate to reset password screen with email and role
        router.push({
          pathname: "/auth/resetPassword",
          params: { 
            email: data.email, 
            role: role,
            resetToken: response.data.data.resetToken 
          }
        });
      }
    } catch (error) {
      // Handle specific error cases
      let errorMessage = "Something went wrong";
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. Please check your internet connection and try again.";
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = "Network error. Please check your internet connection and make sure the server is running.";
      } else if (error.response?.status === 404) {
        errorMessage = `Email not found for ${role} role. Please check your email address and make sure you selected the correct role.`;
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data.message || "Invalid email or role combination";
      } else if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please try again later.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.outerContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.centeredContainer}>
          <Animated.View entering={FadeInUp.duration(800)} style={styles.card}>
            {/* Header */}
            <Animated.View entering={FadeInUp.duration(800).delay(200)} style={styles.header}>
              <Text style={styles.title}>Forgot Password</Text>
              <Text style={styles.subtitle}>
                Select your role and enter your email address. We'll verify the email exists for that role and send you an OTP to reset your password.
              </Text>
            </Animated.View>

            {/* Role Selection */}
            <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.roleContainer}>
              <Button
                mode={role === "customer" ? "contained" : "outlined"}
                onPress={() => {
                  setRole("customer");
                  reset({ email: "" }); // Clear email field when role changes
                }}
                style={[
                  styles.roleButton,
                  role === "customer" && styles.selectedRoleButton,
                ]}
                labelStyle={styles.roleButtonLabel}
                contentStyle={styles.roleButtonContent}
              >
                Customer
              </Button>

              <Button
                mode={role === "provider" ? "contained" : "outlined"}
                onPress={() => {
                  setRole("provider");
                  reset({ email: "" }); // Clear email field when role changes
                }}
                style={[
                  styles.roleButton,
                  role === "provider" && styles.selectedRoleButton,
                ]}
                labelStyle={styles.roleButtonLabel}
                contentStyle={styles.roleButtonContent}
              >
                Provider
              </Button>

              <Button
                mode={role === "Admin" ? "contained" : "outlined"}
                onPress={() => {
                  setRole("Admin");
                  reset({ email: "" }); // Clear email field when role changes
                }}
                style={[
                  styles.roleButton,
                  role === "Admin" && styles.selectedRoleButton,
                ]}
                labelStyle={styles.roleButtonLabel}
                contentStyle={styles.roleButtonContent}
              >
                Admin
              </Button>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.duration(800)}>
              <InputField
                label="Email Address"
                control={control}
                name="email"
                keyboardType="email-address"
                error={errors.email && errors.email.message}
              />

              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                style={styles.submitButton}
                labelStyle={{ fontWeight: "bold", fontSize: 18 }}
              >
                {loading ? (
                  <ActivityIndicator animating color="#fff" />
                ) : (
                  "Send OTP"
                )}
              </Button>


              {/* Back to Login Button */}
              <Button
                mode="text"
                onPress={() => router.push("/auth/login")}
                style={styles.backButton}
                labelStyle={{ color: "#8A63D2", fontSize: 16 }}
                icon="arrow-left"
              >
                Back to Login
              </Button>

              {/* Go to Home Button */}
              <Button
                mode="text"
                onPress={() => router.push("/")}
                style={styles.homeButton}
                labelStyle={{ color: "#6B7280", fontSize: 14 }}
                icon="home"
              >
                Go to Home
              </Button>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Snackbar */}
        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
          duration={2000}
          style={{
            backgroundColor: snackbar.type === "error" ? "#ff4d4d" : "#4BB543",
          }}
        >
          {snackbar.message}
        </Snackbar>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Reusable Input Field
const InputField = ({ control, name, label, keyboardType, error }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <TextInput
          mode="outlined"
          value={value}
          onBlur={onBlur}
          onChangeText={onChange}
          keyboardType={keyboardType}
          style={styles.input}
          textColor="black"
          error={!!error}
          theme={{ colors: { primary: "#8A63D2", placeholder: "#AAA" } }}
        />
      )}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#F0F2F5",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  centeredContainer: {
    width: "100%",
    alignItems: "center",
  },
  card: {
    width: width > 500 ? 450 : "95%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    marginVertical: 30,
  },
  header: { alignItems: "center", marginBottom: 24 },
  title: {
    color: "#22223B",
    fontWeight: "bold",
    fontSize: 28,
    textAlign: "center",
  },
  subtitle: {
    color: "#6C6C80",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    marginTop: 8,
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 20,
    gap: 8,
  },
  roleButton: {
    flexGrow: 1,
    borderRadius: 8,
  },
  selectedRoleButton: {
    backgroundColor: "#8A63D2",
  },
  roleButtonLabel: {
    fontSize: 15,
    fontWeight: "600",
    textTransform: "none",
  },
  roleButtonContent: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    color: "#22223B",
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 5,
    marginTop: 10,
  },
  input: { backgroundColor: "#F5F6FA", borderRadius: 8 },
  submitButton: {
    borderRadius: 8,
    marginTop: 24,
    backgroundColor: "#8A63D2",
    paddingVertical: 8,
  },
  backButton: { marginTop: 10, alignSelf: "center" },
  homeButton: { marginTop: 8, alignSelf: "center" },
  errorText: { color: "#FF4D4F", fontSize: 13, marginBottom: 6, marginTop: 2 },
});

export default ForgotPassword;
