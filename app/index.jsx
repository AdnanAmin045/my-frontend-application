import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Button, Text, Card } from "react-native-paper";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function Index() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkAuth = async () => {
      const user = await AsyncStorage.getItem("user");
      setAccessToken(user ? JSON.parse(user).accessToken : null);
      setUserRole(user ? JSON.parse(user).role : null);
    };
    checkAuth();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleDashboardNavigation = () => {
    if (userRole === "customer") router.replace("/userdashboard");
    if (userRole === "provider") router.replace("/providerdashboard");
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    setAccessToken(null);
    setUserRole(null);
    router.replace("/auth/login");
  };

  const testimonials = [
    {
      name: "Ayesha K.",
      text: "Booked laundry and cleaning in one app. Super convenient and reliable!",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      name: "Ali R.",
      text: "Got my suit stitched and delivered on time. Highly recommended!",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      name: "Sara M.",
      text: "The home cleaning service was professional and affordable.",
      avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    },
  ];

  const partners = [
    {
      name: "Surf Excel",
      logo: "https://1000logos.net/wp-content/uploads/2021/05/Surf-Excel-logo.png",
      url: "https://www.surfexcel.com/",
    },
    {
      name: "ServiceSew",
      logo: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png",
      url: "https://www.tailorbrands.com/",
    },
    {
      name: "CleanPro",
      logo: "https://cdn-icons-png.flaticon.com/512/2917/2917995.png",
      url: "https://www.cleanpro.com/",
    },
  ];

  const services = [
    {
      title: "Laundry",
      image:
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80",
    },
    {
      title: "Stitching",
      image:
        "https://images.unsplash.com/photo-1574180045827-681f8a1a9622?auto=format&fit=crop&w=400&q=80",
    },
    {
      title: "Home Cleaning",
      image:
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80",
    },
    {
      title: "Repairs",
      image:
        "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
    },
    {
      title: "Appliance Fix",
      image:
        "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
          }}
          style={styles.heroImageMobile}
        />
        <View style={styles.heroContentMobile}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png",
            }}
            style={styles.logo}
          />
          <Text style={styles.heroTitleMobile}>
            All Your Daily Needs.{"\n"}
            <Text style={{ color: "#6366F1" }}>One App.</Text>
          </Text>
          <Text style={styles.heroSubtitleMobile}>
            Book laundry, stitching, cleaning, and more from trusted local pros.
          </Text>

          {/* Buttons */}
          {/* <View style={styles.heroButtonsMobile}>
            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
              {accessToken ? (
                <>
                  <Button
                    key="dashboard"
                    mode="contained"
                    style={[styles.centerButton, styles.dashboardButton]}
                    onPress={handleDashboardNavigation}
                    labelStyle={{ fontWeight: "bold" }}
                  >
                    Go to Dashboard
                  </Button>
                  <Button
                    key="logout"
                    mode="outlined"
                    style={[styles.centerButton, styles.logoutButton]}
                    onPress={handleLogout}
                    labelStyle={{ fontWeight: "bold", color: "#6366F1" }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    key="login"
                    mode="outlined"
                    style={[styles.centerButton, styles.logoutButton]}
                    onPress={() => router.push("/auth/login")}
                    labelStyle={{ fontWeight: "bold", color: "#6366F1" }}
                  >
                    Login
                  </Button>
                  <Button
                    key="signup"
                    mode="contained"
                    style={[styles.centerButton, styles.dashboardButton]}
                    onPress={() => router.push("/auth/signUp")}
                    labelStyle={{ fontWeight: "bold" }}
                  >
                    Signup
                  </Button>
                </>
              )}
            </View>
          </View> */}
        </View>
      </View>

      {/* Popular Services */}
      <Text style={styles.sectionHeading}>Popular Services</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
      >
        {services.map((item, index) => (
          <Card key={index} style={styles.serviceCard}>
            <Card.Cover
              source={{ uri: item.image }}
              style={styles.serviceImage}
            />
            <Card.Content>
              <Text style={styles.serviceTitle}>{item.title}</Text>
              <Text style={styles.serviceDesc}>
                Reliable & affordable {item.title.toLowerCase()} service near
                you.
              </Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      {/* Testimonials */}
      <Text style={styles.sectionHeading}>What Our Users Say</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
      >
        {testimonials.map((t, idx) => (
          <View key={idx} style={styles.testimonialCard}>
            <Image
              source={{ uri: t.avatar }}
              style={styles.testimonialAvatar}
            />
            <Text style={styles.testimonialText}>"{t.text}"</Text>
            <Text style={styles.testimonialName}>- {t.name}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Partners */}
      <Text style={styles.sectionHeading}>Our Partners</Text>
      <View style={styles.partnersContainer}>
        {partners.map((p, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.partnerLogoWrap}
            onPress={() => Linking.openURL(p.url)}
          >
            <Image source={{ uri: p.logo }} style={styles.partnerLogo} />
            <Text style={styles.partnerName}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4FF" },
  heroSection: {
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImageMobile: {
    width: "100%",
    height: 180,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: -30,
  },
  heroContentMobile: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    marginTop: -40,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#EEF2FF",
  },
  heroTitleMobile: {
    fontWeight: "bold",
    color: "#22223B",
    fontSize: 26,
    textAlign: "center",
    marginBottom: 8,
    marginTop: 2,
  },
  heroSubtitleMobile: {
    color: "#6C6C80",
    fontSize: 15,
    marginBottom: 18,
    textAlign: "center",
  },
  heroButtonsMobile: { justifyContent: "center", alignItems: "center" },
  centerButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    minWidth: 140,
  },
  dashboardButton: { backgroundColor: "#6366F1" },
  logoutButton: {
    borderColor: "#6366F1",
    borderWidth: 1.5,
    backgroundColor: "#fff",
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: "bold",
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: "#111827",
    letterSpacing: 0.2,
  },
  horizontalScroll: { paddingLeft: 16, paddingBottom: 10 },
  serviceCard: {
    width: 180,
    marginRight: 16,
    marginBottom: 10,
    elevation: 2,
    backgroundColor: "#fff",
    borderRadius: 14,
  },
  serviceImage: {
    height: 100,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  serviceTitle: { color: "#22223B", fontWeight: "bold", marginTop: 8 },
  serviceDesc: { color: "#6C6C80", marginTop: 2, marginBottom: 4 },
  testimonialCard: {
    width: 240,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginRight: 16,
    alignItems: "center",
    elevation: 2,
  },
  testimonialAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginBottom: 8,
  },
  testimonialText: {
    fontStyle: "italic",
    color: "#374151",
    fontSize: 15,
    marginBottom: 6,
    textAlign: "center",
  },
  testimonialName: { color: "#6366F1", fontWeight: "bold", fontSize: 15 },
  partnersContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 18,
    paddingVertical: 16,
    flexWrap: "wrap",
  },
  partnerLogoWrap: {
    alignItems: "center",
    marginHorizontal: 10,
    marginBottom: 8,
  },
  partnerLogo: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: "#fff",
  },
  partnerName: { fontSize: 13, color: "#374151", fontWeight: "600" },
});
