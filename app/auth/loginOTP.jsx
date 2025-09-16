import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Snackbar,
} from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../baseURL";

export default function OtpVerification() {
  const { email, userId, role } = useLocalSearchParams(); // role from params
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const verifyOtp = async () => {
    if (!otp.trim()) {
      setSnackbar({
        visible: true,
        message: "Please enter OTP",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      // Send OTP verification request
      const { data } = await axios.post(`${API_URL}/users/verify-otp`, {
        userId,
        role,
        otp,
      });
      // Extract tokens and role from backend response
      const { accessToken, refreshToken, role: userRole } = data.data;

      // Save user data in AsyncStorage
      await AsyncStorage.setItem(
        "user",
        JSON.stringify({ accessToken, refreshToken, role: userRole })
      );


      // Navigate based on role
      router.push(userRole === "customer" ? "/userDashboard" : "/providerDashboard");
    } catch (error) {
      setSnackbar({
        visible: true,
        message: error?.response?.data?.message || "Verification failed",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Enter OTP sent to {email}</Text>
      <TextInput
        mode="outlined"
        placeholder="Enter 6-digit OTP"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={verifyOtp}
        disabled={loading}
        style={styles.verifyButton}
      >
        {loading ? <ActivityIndicator animating color="#fff" /> : "Verify OTP"}
      </Button>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F0F2F5",
  },
  heading: {
    fontSize: 18,
    marginBottom: 20,
    color: "#333",
    fontWeight: "bold",
    textAlign: "center",
  },
  input: { width: "80%", marginBottom: 20, backgroundColor: "#fff" },
  verifyButton: { width: "80%", borderRadius: 8, backgroundColor: "#8A63D2" },
});
