import React, { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  IconButton,
  Snackbar,
} from "react-native-paper";
import axios from "axios";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { API_URL } from "../../baseURL";

const { width } = Dimensions.get("window");

const signupSchema = z
  .object({
    username: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm Password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const Signup = () => {
  const router = useRouter();
  const [secureTextPassword, setSecureTextPassword] = useState(true);
  const [secureTextConfirmPassword, setSecureTextConfirmPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      console.log("Signup URL: ", `${API_URL}/users/register`);
      const res = await axios.post(`${API_URL}/users/register`, {
        username: data.username,
        email: data.email,
        password: data.password,
      });

      if (res.status === 201) {
        setVisible(true);
        setTimeout(() => router.replace("/auth/login"), 2000);
      } else {
        Alert.alert("Error", "Signup failed! Try again.");
      }
    } catch (error) {
      Alert.alert(
        "Network Error",
        "Something went wrong. Please check your connection and try again."
      );
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
              <Text variant="headlineLarge" style={styles.title}>Create Account</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>Sign up to get started</Text>
            </View>

            <View style={styles.formContainer}>
              {/* Name */}
              <InputField control={control} name="username" label="Name" error={errors.username?.message} />
              {/* Email */}
              <InputField control={control} name="email" label="Email" keyboardType="email-address" error={errors.email?.message} />
              {/* Password */}
              <PasswordField
                control={control}
                name="password"
                label="Password"
                secureText={secureTextPassword}
                setSecureText={setSecureTextPassword}
                error={errors.password?.message}
              />
              {/* Confirm Password */}
              <PasswordField
                control={control}
                name="confirmPassword"
                label="Confirm Password"
                secureText={secureTextConfirmPassword}
                setSecureText={setSecureTextConfirmPassword}
                error={errors.confirmPassword?.message}
              />

              {/* Buttons */}
              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                style={styles.signUpButton}
                labelStyle={{ fontWeight: "bold", fontSize: 18 }}
              >
                {loading ? <ActivityIndicator animating color="#fff" /> : "Sign Up"}
              </Button>

              <Button
                mode="contained"
                disabled={loading}
                onPress={() => router.push("/auth/signUpProvider")}
                style={[styles.signUpButton, { backgroundColor: "#4B0082", marginTop: 16 }]}
                labelStyle={{ fontWeight: "bold", fontSize: 16 }}
              >
                Sign Up as a Provider
              </Button>

              <Button
                mode="contained"
                disabled={loading}
                onPress={() => router.push("/auth/login")}
                style={[styles.signUpButton, { backgroundColor: "#6C63FF", marginTop: 16 }]}
                labelStyle={{ fontWeight: "bold", fontSize: 16 }}
              >
                Login
              </Button>
            </View>
          </Animated.View>
        </View>

        {/* Snackbar */}
        <Snackbar
          visible={visible}
          onDismiss={() => setVisible(false)}
          duration={2000}
          style={{ backgroundColor: "green" }}
        >
          ✅ Account created successfully!
        </Snackbar>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Reusable InputField
const InputField = ({ control, name, label, keyboardType, error }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <TextInput
          mode="outlined"
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          style={styles.input}
          textColor="black"
          theme={{ colors: { primary: "#6C63FF", placeholder: "#A1A1AA" } }}
          error={!!error}
        />
      )}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// PasswordField component
const PasswordField = ({ control, name, label, secureText, setSecureText, error }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.passwordContainer}>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            mode="outlined"
            secureTextEntry={secureText}
            value={value}
            onChangeText={onChange}
            style={[styles.input, { flex: 1 }]}
            textColor="black"
            theme={{ colors: { primary: "#6C63FF", placeholder: "#A1A1AA" } }}
            error={!!error}
          />
        )}
      />
      <IconButton
        icon={secureText ? "eye-off" : "eye"}
        onPress={() => setSecureText(!secureText)}
        size={22}
        style={styles.iconButton}
        iconColor="#A1A1AA"
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: "#F3F4F6" },
  scrollContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingVertical: 20 },
  centeredContainer: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center" },
  card: { width: width > 500 ? 450 : "90%", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6, marginVertical: 20 },
  header: { alignItems: "center", marginBottom: 20 },
  title: { color: "#1F2937", fontWeight: "700", fontSize: 28, textAlign: "center" },
  subtitle: { color: "#6B7280", fontSize: 16, textAlign: "center", marginTop: 4 },
  formContainer: { flexDirection: "column" },
  label: { color: "#1F2937", fontWeight: "600", fontSize: 14, marginBottom: 4 },
  input: { backgroundColor: "#F9FAFB", borderRadius: 8 },
  passwordContainer: { flexDirection: "row", alignItems: "center", position: "relative" },
  iconButton: { position: "absolute", right: 8, top: "28%", transform: [{ translateY: -11 }], zIndex: 2 },
  signUpButton: { borderRadius: 8, paddingVertical: 8, backgroundColor: "#6C63FF" },
  errorText: { color: "#EF4444", fontSize: 12, marginTop: 2 },
});

export default Signup;
