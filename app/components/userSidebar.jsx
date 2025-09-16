import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";
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

  return (
    <View style={styles.container}>
      <View style={styles.menuContainer}>
        {userSidebarItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href} asChild>
              <TouchableOpacity
                style={[
                  styles.iconContainer,
                  isActive && styles.activeIconContainer,
                ]}
              >
                <View
                  style={[
                    styles.iconWrapper,
                    isActive && styles.activeIconWrapper,
                  ]}
                >
                  <FontAwesome5
                    name={item.icon}
                    size={20}
                    color={isActive ? "#FFFFFF" : "#9CA3AF"}
                  />
                </View>
                <Text style={[styles.label, isActive && styles.activeLabel]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#374151",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
  },
  menuContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 70,
  },
  activeIconContainer: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginBottom: 6,
  },
  activeIconWrapper: {
    backgroundColor: "#3B82F6",
  },
  label: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  activeLabel: {
    color: "#3B82F6",
    fontWeight: "600",
  },
});
