import { View, TouchableOpacity, ScrollView, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";

const userSidebarItems = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/userdashboard/explore", icon: "search", label: "Explore" },
  { href: "/userdashboard/service-selection", icon: "tools", label: "Services" },
  { href: "/userdashboard/profile", icon: "user", label: "Profile" },
];

export default function UserSidebar() {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {userSidebarItems.map((item, idx) => (
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
    backgroundColor: "#000",
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