import { View, TouchableOpacity, ScrollView, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";

const providerSidebarItems = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/providerDashboard/orders", icon: "clipboard-list", label: "Orders" },
  { href: "/providerDashboard/offers", icon: "tag", label: "Offers" },
  { href: "/providerDashboard/riders", icon: "users", label: "Riders" },
  { href: "/providerDashboard/profile", icon: "user", label: "Profile" },
];

export default function ProviderSidebar() {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {providerSidebarItems.map((item) => (
          <Link key={item.href} href={item.href} asChild>
            <TouchableOpacity style={styles.iconContainer}>
              <FontAwesome5 name={item.icon} size={24} color="white" />
              <Text style={styles.label}>{item.label}</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    paddingVertical: 10,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  iconContainer: {
    width: 70,
    alignItems: "center",
    marginHorizontal: 8,
  },
  label: {
    color: "white",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
});