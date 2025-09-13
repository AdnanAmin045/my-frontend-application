import { Stack } from "expo-router";
import UserSidebar from "../components/userSidebar";
import { View } from "react-native";

export default function UserDashboardLayout() {
  return (
    <View style={{ flexDirection: "row" }}>
      <UserSidebar />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: "UserDashboard" }} />
        <Stack.Screen name="explore" options={{ title: "Explore" }} />
        <Stack.Screen name="profile" options={{ title: "profile" }} />
        <Stack.Screen name="service-selection" options={{ title: "ServiceSelection" }} />
      </Stack>
    </View>
  );
}