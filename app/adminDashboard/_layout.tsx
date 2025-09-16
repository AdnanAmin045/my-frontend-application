import { Stack } from "expo-router";
import AdminSidebar from "../components/adminSidebar";
import { View } from "react-native";

const DashboardLayout = () => {
  return (
    <View style={{ flex: 1, paddingTop: 20 }}> {/* Added paddingTop here */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: "Dashboard" }} />
        {/* <Stack.Screen name="orders" options={{ title: "Orders" }} />
        <Stack.Screen name="services" options={{ title: "Services" }} />
        <Stack.Screen name="applications" options={{ title: "Applications" }} />
        <Stack.Screen name="applicationspage" options={{ title: "ApplicationsPage" }} />
        <Stack.Screen name="service-providers" options={{ title: "ServiceProviders" }} />
        <Stack.Screen name="feedbacks" options={{ title: "Feedbacks" }} />
        <Stack.Screen name="orders-history" options={{ title: "Order's History" }} />
        <Stack.Screen name="ride-history" options={{ title: "Ride's History" }} />
        <Stack.Screen name="riders" options={{ title: "Riders" }} />
        <Stack.Screen name="ride-feedback" options={{ title: "RidersFeedback" }} />
        <Stack.Screen name="profile" options={{ title: "profile" }} />
        <Stack.Screen name="explore" options={{ title: "explorePage" }} />
        <Stack.Screen name="service-selection" options={{ title: "serviceSelection" }} /> */}
      </Stack>
      <AdminSidebar />
    </View>
  );
}

export default DashboardLayout;