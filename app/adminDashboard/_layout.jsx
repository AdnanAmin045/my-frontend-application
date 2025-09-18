import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import AdminSidebar from "../components/adminSidebar";
import { StyleSheet, View } from "react-native";
import { ProtectedRoute } from "../components/ProtectedRoute";

const DashboardLayout = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Content: Stack Screens */}
      <View style={styles.stackContainer}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ title: "Dashboard" }} />
          <Stack.Screen name="application" options={{ title: "Application" }} />
          <Stack.Screen name="services" options={{ title: "Services" }} />
          <Stack.Screen name="review" options={{ title: "Review" }} />
          <Stack.Screen name="payments" options={{ title: "Payments" }} />
          {/* Add more screens here if needed */}
        </Stack>
      </View>

      {/* Bottom Fixed Sidebar */}
      <View style={styles.sidebarContainer}>
        <AdminSidebar />
      </View>
    </SafeAreaView>
  );
};

export default DashboardLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2", // 🔥 Added light background (same as your other layouts)
  },
  stackContainer: {
    flex: 1,
    paddingTop: 20,
  },
  sidebarContainer: {
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "white",
  },
});
