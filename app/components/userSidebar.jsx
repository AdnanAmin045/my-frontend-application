import { View, TouchableOpacity, Text, StyleSheet, Dimensions, ScrollView, useWindowDimensions } from "react-native";
import { Link, usePathname } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const userSidebarItems = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/userDashboard/explore", icon: "search", label: "Explore" },
  { href: "/userDashboard/orders", icon: "shopping-cart", label: "Orders" },
  { href: "/userDashboard/measurements", icon: "ruler", label: "Measurements" },
  { href: "/userDashboard/profile", icon: "user", label: "Profile" },
];

export default function UserSidebar() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { minWidth: width } // Ensure it spans full width on larger screens
        ]}
      >
        {userSidebarItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link key={item.href} href={item.href} asChild>
              <TouchableOpacity style={[
                styles.iconContainer,
                isActive && styles.activeIconContainer
              ]}>
                <View style={[
                  styles.iconWrapper,
                  isActive && styles.activeIconWrapper
                ]}>
                  <FontAwesome5 
                    name={item.icon} 
                    size={22} 
                    color={isActive ? "#FFFFFF" : "#9CA3AF"} 
                  />
                </View>
                <Text style={[
                  styles.label,
                  isActive && styles.activeLabel
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            </Link>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 8,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 75,
    flex: 1,
  },
  activeIconContainer: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 8,
  },
  activeIconWrapper: {
    backgroundColor: "#3B82F6",
  },
  label: {
    color: "#D1D5DB",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 2,
    lineHeight: 13,
  },
  activeLabel: {
    color: "#3B82F6",
    fontWeight: "600",
  },
});
