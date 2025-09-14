import { Stack } from "expo-router";
import UserSidebar from "../components/userSidebar";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
export default function UserDashboardLayout() {
  return (
    <>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: "UserDashboard" }} />
            <Stack.Screen name="explore" options={{ title: "Explore" }} />
            {/* <Stack.Screen name="profile" options={{ title: "profile" }} />
        <Stack.Screen name="service-selection" options={{ title: "ServiceSelection" }} /> */}
          </Stack>
          <UserSidebar />
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
}
