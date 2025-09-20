import { View, TouchableOpacity, ScrollView, Text, StyleSheet, useWindowDimensions } from "react-native";
import { Link, usePathname } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";

const providerSidebarItems = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/providerDashboard/orders", icon: "clipboard-list", label: "Orders" },
  { href: "/providerDashboard/offers", icon: "tag", label: "Offers" },
  { href: "/providerDashboard/riders", icon: "users", label: "Riders" },
  { href: "/providerDashboard/payments", icon: "money-bill-wave", label: "Payments" },
];

export default function ProviderSidebar() {
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
        {providerSidebarItems.map((item) => {
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