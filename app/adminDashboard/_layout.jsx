import { Stack } from "expo-router";
import AdminSidebar from "../components/adminSidebar";
import { View, StyleSheet } from "react-native";

const DashboardLayout = () => {
  return (
    <View style={styles.container}>
      {/* Top Content: Stack Screens */}
      <View style={styles.stackContainer}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ title: "Dashboard" }} />
          <Stack.Screen name="application" options={{ title: "Application" }} />
          <Stack.Screen name="services" options={{ title: "Services" }} />
          <Stack.Screen name="review" options={{ title: "Review" }} />
          {/* Add other screens here if needed */}
        </Stack>
      </View>

      {/* Bottom Fixed Sidebar */}
      <View style={styles.sidebarContainer}>
        <AdminSidebar />
      </View>
    </View>
  );
};

export default DashboardLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
