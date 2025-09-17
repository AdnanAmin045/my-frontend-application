import { Stack } from "expo-router";
import UserSidebar from "../components/userSidebar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { View } from "react-native";
import { ProtectedRoute } from "../components/ProtectedRoute";

export default function UserDashboardLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ title: "UserDashboard" }} />
          <Stack.Screen name="explore" options={{ title: "Explore" }} />
          <Stack.Screen name="orders" options={{ title: "Orders" }} />
          <Stack.Screen
            name="measurements"
            options={{ title: "Measurements" }}
          />
          <Stack.Screen name="profile" options={{ title: "Profile" }} />
        </Stack>
        <UserSidebar />
      </View>
    </View>
  );
}
