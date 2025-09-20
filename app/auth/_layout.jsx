import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { PublicRoute } from "../components/ProtectedRoute";

export default function AuthLayout() {
  return (
    <PublicRoute>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="login" options={{ title: "Login" }} />
          <Stack.Screen name="loginOTP" options={{ title: "LoginOTP" }} />
          <Stack.Screen name="signUp" options={{ title: "Sign Up" }} />
          <Stack.Screen
            name="signUpProvider"
            options={{ title: "signUpProvider" }}
          />
          <Stack.Screen
            name="forgotPassword"
            options={{ title: "Forgot Password" }}
          />
          <Stack.Screen
            name="resetPassword"
            options={{ title: "Reset Password" }}
          />
        </Stack>
      </SafeAreaView>
    </PublicRoute>
  );
}
