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
  IconButton,
  ActivityIndicator,
  Snackbar,
} from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as z from "zod";
import axios from "axios";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { API_URL } from "../../baseURL";

const { width } = Dimensions.get("window");

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const router = useRouter();
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("customer");
  const [snackbar, setSnackbar] = useState({ visible: false, message: "", type: "success" });

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
  });

  const showSnackbar = (message, type = "success") => {
    setSnackbar({ visible: true, message, type });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data, role };
      console.log("Login URL: ", `${API_URL}/users/login`);
      const response = await axios.post(`${API_URL}/users/login`, payload);

      if (response.status === 200) {
        showSnackbar("OTP sent to your email!", "success");

        // Navigate to OTP screen and pass email + role + userId
        router.push({
          pathname: "/auth/loginOTP",
          params: {
            email: data.email,
            userId: response.data.data.userId,
            role: role,
          },
        });
      } else {
        showSnackbar("Invalid credentials!", "error");
      }
    } catch (error) {
      showSnackbar(error?.response?.data?.message || "Something went wrong", "error");
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
            <View style={styles.header}>
              <Text variant="headlineLarge" style={styles.title}>Welcome Back</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>Login to continue</Text>
            </View>

            {/* Role Selector */}
            <View style={styles.roleContainer}>
              <Button
                mode={role === "customer" ? "contained" : "outlined"}
                onPress={() => setRole("customer")}
                style={styles.roleButton}
              >
                Customer
              </Button>
              <Button
                mode={role === "provider" ? "contained" : "outlined"}
                onPress={() => setRole("provider")}
                style={styles.roleButton}
              >
                Service
              </Button>
            </View>

            {/* Form */}
            <Animated.View entering={FadeInDown.duration(800)}>
              <InputField
                label="Email"
                control={control}
                name="email"
                keyboardType="email-address"
                error={errors.email && errors.email.message}
              />

              <PasswordField
                label="Password"
                control={control}
                name="password"
                secureText={secureText}
                setSecureText={setSecureText}
                error={errors.password && errors.password.message}
              />

              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                style={styles.signUpButton}
                labelStyle={{ fontWeight: "bold", fontSize: 18 }}
              >
                {loading ? <ActivityIndicator animating color="#fff" /> : "Login"}
              </Button>

              {/* 🔥 Added Sign Up Button */}
              <Button
                mode="text"
                onPress={() => router.push("/auth/signUp")}
                style={styles.registerButton}
                labelStyle={{ color: "#8A63D2", fontSize: 16 }}
              >
                Don't have an account? Sign Up
              </Button>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Snackbar */}
        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
          duration={2000}
          style={{ backgroundColor: snackbar.type === "error" ? "#ff4d4d" : "#4BB543" }}
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

// Password Field
const PasswordField = ({ control, name, label, secureText, setSecureText, error }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.passwordContainer}>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            mode="outlined"
            secureTextEntry={secureText}
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            style={[styles.input, { flex: 1 }]}
            textColor="black"
            error={!!error}
            theme={{ colors: { primary: "#8A63D2", placeholder: "#AAA" } }}
          />
        )}
      />
      <IconButton
        icon={secureText ? "eye-off" : "eye"}
        onPress={() => setSecureText(!secureText)}
        size={22}
        style={styles.iconButton}
        iconColor="#AAA"
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#F0F2F5" },
  scrollContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center", minHeight: "100%" },
  centeredContainer: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  card: { width: width > 500 ? 450 : "95%", backgroundColor: "#fff", borderRadius: 16, padding: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8, marginVertical: 30 },
  header: { alignItems: "center", marginBottom: 24 },
  title: { color: "#22223B", fontWeight: "bold", fontSize: 28, textAlign: "center" },
  subtitle: { color: "#6C6C80", fontSize: 16, textAlign: "center", marginBottom: 10 },
  roleContainer: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  roleButton: { marginHorizontal: 8, flex: 1 },
  label: { color: "#22223B", fontWeight: "600", fontSize: 15, marginBottom: 5, marginTop: 10 },
  input: { backgroundColor: "#F5F6FA", borderRadius: 8 },
  passwordContainer: { flexDirection: "row", alignItems: "center", position: "relative" },
  iconButton: { position: "absolute", right: 10, top: "28%", transform: [{ translateY: -11 }], zIndex: 2 },
  signUpButton: { borderRadius: 8, marginTop: 24, backgroundColor: "#8A63D2", paddingVertical: 8 },
  registerButton: { marginTop: 10, alignSelf: "center" },
  errorText: { color: "#FF4D4F", fontSize: 13, marginBottom: 6, marginTop: 2 },
});

export default Login;
