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
  IconButton,
} from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { API_URL } from "../../baseURL";

const { width } = Dimensions.get("window");

// Zod validation schema for password reset
const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(
        /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one letter, one number, and one special character"
      ),
    confirmPassword: z.string().min(1, "Confirm Password is required"),
    otp: z
      .string()
      .min(1, "OTP is required")
      .regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const ResetPassword = () => {
  const router = useRouter();
  const { email, role, resetToken } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [secureTextConfirm, setSecureTextConfirm] = useState(true);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onSubmit",
  });

  const showSnackbar = (message, type = "success") => {
    setSnackbar({ visible: true, message, type });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        email,
        role,
        resetToken,
        otp: data.otp,
        newPassword: data.newPassword,
      };
      
      console.log("Sending reset password request:", { ...payload, newPassword: "[HIDDEN]" });
      
      const response = await axios.put(`${API_URL}/users/reset-password`, payload);
      
      if (response.status === 200) {
        showSnackbar("Password reset successfully!", "success");
        // Navigate back to login after a short delay
        setTimeout(() => {
          router.replace("/auth/login");
        }, 2000);
      }
    } catch (error) {
      console.log("Reset password error:", error.response?.data);
      
      // Handle specific error cases
      let errorMessage = "Something went wrong";
      
      if (error.response?.status === 400) {
        if (error.response.data.message?.includes("Invalid OTP")) {
          errorMessage = "Invalid or expired OTP. Please check and try again.";
        } else if (error.response.data.message?.includes("Token")) {
          errorMessage = "Reset token expired. Please request a new OTP.";
        } else {
          errorMessage = error.response.data.message || "Invalid data provided";
        }
      } else if (error.response?.status === 404) {
        errorMessage = "Email not found. Please verify your email address.";
      } else if (error.response?.status === 429) {
        errorMessage = "Too many attempts. Please try again later.";
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
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter the OTP sent to {email} and your new password
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.duration(800)}>
              <InputField
                label="OTP"
                control={control}
                name="otp"
                keyboardType="number-pad"
                error={errors.otp && errors.otp.message}
                placeholder="Enter 6-digit OTP"
              />

              <PasswordField
                label="New Password"
                control={control}
                name="newPassword"
                secureText={secureText}
                setSecureText={setSecureText}
                error={errors.newPassword && errors.newPassword.message}
              />

              <PasswordField
                label="Confirm New Password"
                control={control}
                name="confirmPassword"
                secureText={secureTextConfirm}
                setSecureText={setSecureTextConfirm}
                error={errors.confirmPassword && errors.confirmPassword.message}
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
                  "Reset Password"
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
const InputField = ({ control, name, label, keyboardType, error, placeholder }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <TextInput
          mode="outlined"
          placeholder={placeholder}
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

// Reusable Password Field
const PasswordField = ({ control, name, label, secureText, setSecureText, error }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <View style={styles.passwordContainer}>
          <TextInput
            mode="outlined"
            placeholder={`Enter ${label.toLowerCase()}`}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            secureTextEntry={secureText}
            style={[styles.input, styles.passwordInput]}
            textColor="black"
            error={!!error}
            theme={{ colors: { primary: "#8A63D2", placeholder: "#AAA" } }}
          />
          <IconButton
            icon={secureText ? "eye-off" : "eye"}
            iconColor="#666"
            size={20}
            onPress={() => setSecureText(!secureText)}
            style={styles.iconButton}
          />
        </View>
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
  label: {
    color: "#22223B",
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 5,
    marginTop: 10,
  },
  input: { backgroundColor: "#F5F6FA", borderRadius: 8 },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  passwordInput: {
    flex: 1,
    paddingRight: 50,
  },
  iconButton: {
    position: "absolute",
    right: 10,
    top: "28%",
    transform: [{ translateY: -11 }],
    zIndex: 2,
  },
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

export default ResetPassword;
