import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";

const userSidebarItems = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/userDashboard/explore", icon: "search", label: "Explore" },
  { href: "/userDashboard/orders", icon: "shopping-cart", label: "Orders" },
  { href: "/userDashboard/measurements", icon: "ruler", label: "Measurements" },
];

export default function UserSidebar() {
  return (
    <View style={styles.container}>
      <View style={styles.menuContainer}>
        {userSidebarItems.map((item) => (
          <Link key={item.href} href={item.href} asChild>
            <TouchableOpacity style={styles.iconContainer}>
              <FontAwesome5 name={item.icon} size={24} color="white" />
              <Text style={styles.label}>{item.label}</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
    paddingVertical: 12,
  },
  menuContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  iconContainer: {
    width: 80, // Adjusted width to fit all items
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4, // Reduced gap for compact layout
    paddingVertical: 8,
  },
  label: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
    textAlign: "center",
  },
});