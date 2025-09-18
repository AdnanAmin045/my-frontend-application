import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import ProviderSidebar from "../components/providerSidebar";
import { ProtectedRoute } from "../components/ProtectedRoute";

export default function ProviderDashboardLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
      {/* You can wrap Stack inside ProtectedRoute if needed */}
      {/* <ProtectedRoute> */}
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" options={{ title: "Dashboard" }} />
        <Stack.Screen name="orders" options={{ title: "Orders" }} />
        <Stack.Screen name="offers" options={{ title: "Offers" }} />
        <Stack.Screen name="riders" options={{ title: "Riders" }} />
        <Stack.Screen name="payments" options={{ title: "Payments" }} />
      </Stack>

      {/* Sidebar should stay visible on all screens */}
      <ProviderSidebar />
      {/* </ProtectedRoute> */}
    </SafeAreaView>
  );
}
