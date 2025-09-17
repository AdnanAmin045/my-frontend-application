import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";

export default function ProviderDashboardLayout() {
  return (
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
      </Stack>
    </SafeAreaView>
  );
}
