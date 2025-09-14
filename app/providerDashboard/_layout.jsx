import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from "expo-router";
import ProviderSidebar from "../components/providerSidebar";

export default function ProviderDashboardLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ title: "Dashboard" }} />
          <Stack.Screen name="orders" options={{ title: "Orders" }} />
        </Stack>
        <ProviderSidebar />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
