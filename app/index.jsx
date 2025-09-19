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
  StatusBar,
} from "react-native";
import { Button, Text, Card } from "react-native-paper";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';
import icon from "../assets/icon.png";

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
    if (userRole === "customer") router.replace("/userDashboard");
    if (userRole === "provider") router.replace("/providerDashboard");
    if (userRole === "Admin") router.replace("/adminDashboard");
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    setAccessToken(null);
    setUserRole(null);
    router.replace("/auth/login");
  };

  const testimonials = [
    {
      name: "Ayesha K",
      text: "Booked laundry and tailoring in one app Super convenient and reliable!",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      name: "Ali R",
      text: "Got my suit stitched and delivered on time Highly recommended!",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      name: "Sara M",
      text: "The tailoring service was professional and affordable",
      avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    },
  ];

  const partners = [
    {
      name: "Sparkle Wash",
      logo: "https://cdn-icons-png.flaticon.com/512/2917/2917995.png", // washing machine icon
      url: "#",
      service: "Laundry"
    },
    {
      name: "Tide",
      logo: "https://cdn-icons-png.flaticon.com/512/2917/2917995.png", // washing machine icon
      url: "#",
      service: "Laundry"
    },
    {
      name: "Master Tailor",
      logo: "https://cdn-icons-png.flaticon.com/512/2875/2875883.png", // sewing machine icon
      url: "#",
      service: "Tailoring"
    },
    {
      name: "Perfect Stitch",
      logo: "https://cdn-icons-png.flaticon.com/512/2909/2909761.png", // needle & thread icon
      url: "#",
      service: "Tailoring"
    },
  ];
  

  const services = [
    {
      title: "Laundry",
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80",
      description: "Professional washing, drying, and ironing services"
    },
    {
      title: "Tailor",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      description: "Custom stitching, alterations, and garment repairs"
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#A5B4FC" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#A5B4FC', '#C4B5FD', '#DDD6FE']}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
              <Image source={icon} style={styles.logo} />
              <Text style={styles.appName}>TailorWash</Text>
            </Animated.View>
            
            <Animated.View style={[styles.heroTextContainer, { opacity: fadeAnim }]}>
              <Text style={styles.heroTitle}>
                All Your Daily Needs{"\n"}
                <Text style={styles.heroTitleAccent}>One App</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Book laundry and tailoring services from trusted local professionals
              </Text>
            </Animated.View>

            {/* Feature Icons */}
            <Animated.View style={[styles.featureIcons, { opacity: fadeAnim }]}>
              <View style={styles.featureIcon}>
                <Ionicons name="shirt-outline" size={24} color="#1f2937" />
                <Text style={styles.featureText}>Laundry</Text>
              </View>
              <View style={styles.featureIcon}>
                <Ionicons name="cut-outline" size={24} color="#1f2937" />
                <Text style={styles.featureText}>Tailoring</Text>
              </View>
            </Animated.View>

            {/* Buttons */}
            <Animated.View style={[styles.heroButtons, { opacity: fadeAnim }]}>
              {accessToken ? (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleDashboardNavigation}
                  >
                    <LinearGradient
                      colors={['#fff', '#f8fafc']}
                      style={styles.buttonGradient}
                    >
                      <Ionicons name="grid-outline" size={20} color="#8B5CF6" />
                      <Text style={styles.primaryButtonText}>Dashboard</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleLogout}
                  >
                    <Ionicons name="log-out-outline" size={20} color="#fff" />
                    <Text style={styles.secondaryButtonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push("/auth/signUp")}
                  >
                    <LinearGradient
                      colors={['#fff', '#f8fafc']}
                      style={styles.buttonGradient}
                    >
                      <Ionicons name="person-add-outline" size={20} color="#8B5CF6" />
                      <Text style={styles.primaryButtonText}>Signup</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => router.push("/auth/login")}
                  >
                    <Ionicons name="log-in-outline" size={20} color="#fff" />
                    <Text style={styles.secondaryButtonText}>Login</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </View>
        </LinearGradient>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1000+</Text>
            <Text style={styles.statLabel}>Happy Customers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>50+</Text>
            <Text style={styles.statLabel}>Service Providers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>24/7</Text>
            <Text style={styles.statLabel}>Support</Text>
          </View>
        </View>

        {/* Popular Services */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>Popular Services</Text>
            <Text style={styles.sectionSubheading}>Choose from our wide range of services</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {services.map((item, index) => (
              <TouchableOpacity key={index} style={styles.serviceCard}>
                <View style={styles.serviceImageContainer}>
                  <Image source={{ uri: item.image }} style={styles.serviceImage} />
                  <View style={styles.serviceOverlay}>
                    <Ionicons 
                      name={
                        item.title === "Laundry" ? "shirt-outline" : 
                        "cut-outline"
                      } 
                      size={32} 
                      color="#fff" 
                    />
                  </View>
                </View>
                <View style={styles.serviceContent}>
                  <Text style={styles.serviceTitle}>{item.title}</Text>
                  <Text style={styles.serviceDesc}>
                    {item.description}
                  </Text>
                  <View style={styles.serviceRating}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>4.8</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Testimonials */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>What Our Users Say</Text>
            <Text style={styles.sectionSubheading}>Real feedback from our satisfied customers</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {testimonials.map((t, idx) => (
              <View key={idx} style={styles.testimonialCard}>
                <View style={styles.testimonialHeader}>
                  <Image source={{ uri: t.avatar }} style={styles.testimonialAvatar} />
                  <View style={styles.testimonialRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons key={star} name="star" size={16} color="#FFD700" />
                    ))}
                  </View>
                </View>
                <Text style={styles.testimonialText}>"{t.text}"</Text>
                <Text style={styles.testimonialName}>- {t.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Partners */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>Our Trusted Partners</Text>
            <Text style={styles.sectionSubheading}>Working with industry leaders in laundry & tailoring</Text>
          </View>
          
          {/* Laundry Partners */}
          <View style={styles.partnerCategory}>
            <Text style={styles.partnerCategoryTitle}>Laundry Partners</Text>
            <View style={styles.partnersContainer}>
              {partners.filter(p => p.service === "Laundry").map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.partnerCard}
                  onPress={() => p.url !== "#" && Linking.openURL(p.url)}
                >
                  <Text style={styles.partnerName}>{p.name}</Text>
                  <Text style={styles.partnerService}>{p.service}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tailoring Partners */}
          <View style={styles.partnerCategory}>
            <Text style={styles.partnerCategoryTitle}>Tailoring Partners</Text>
            <View style={styles.partnersContainer}>
              {partners.filter(p => p.service === "Tailoring").map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.partnerCard}
                  onPress={() => p.url !== "#" && Linking.openURL(p.url)}
                >
                  <Text style={styles.partnerName}>{p.name}</Text>
                  <Text style={styles.partnerService}>{p.service}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerLogo}>
              <Image source={icon} style={styles.footerLogoImage} />
              <Text style={styles.footerAppName}>TailorWash</Text>
            </View>
            <Text style={styles.footerText}>
              Your trusted partner for all daily service needs
            </Text>
            <View style={styles.footerIcons}>
              <TouchableOpacity style={styles.footerIcon}>
                <Ionicons name="call-outline" size={20} color="#8B5CF6" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerIcon}>
                <Ionicons name="mail-outline" size={20} color="#8B5CF6" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerIcon}>
                <Ionicons name="location-outline" size={20} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8fafc" 
  },
  
  // Hero Section Styles
  heroSection: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    minHeight: 500,
  },
  heroContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    letterSpacing: 1,
  },
  heroTextContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 40,
  },
  heroTitleAccent: {
    color: "#FFD700",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featureIcons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  featureIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: 80,
  },
  featureText: {
    color: "#1f2937",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  heroButtons: {
    width: "100%",
    paddingHorizontal: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  primaryButton: {
    flex: 2,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B5CF6",
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1f2937",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#374151",
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },

  // Stats Section
  statsSection: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 16,
  },

  // Section Styles
  sectionContainer: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  sectionSubheading: {
    fontSize: 14,
    color: "#6b7280",
  },
  horizontalScroll: {
    marginLeft: -20,
  },
  horizontalScrollContent: {
    paddingLeft: 20,
    paddingRight: 20,
  },

  // Service Cards
  serviceCard: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  serviceImageContainer: {
    position: "relative",
    height: 120,
  },
  serviceImage: {
    width: "100%",
    height: "100%",
  },
  serviceOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(99, 102, 241, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceContent: {
    padding: 16,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  serviceDesc: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  serviceRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },

  // Testimonials
  testimonialCard: {
    width: 280,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  testimonialHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  testimonialAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  testimonialRating: {
    flexDirection: "row",
    gap: 2,
  },
  testimonialText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 16,
    fontStyle: "italic",
  },
  testimonialName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8B5CF6",
  },

  // Partners
  partnerCategory: {
    marginBottom: 32,
  },
  partnerCategoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginBottom: 16,
    textAlign: "center",
  },
  partnersContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 16,
  },
  partnerCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 120,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  partnerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 8,
  },
  partnerService: {
    fontSize: 12,
    color: "#8B5CF6",
    fontWeight: "500",
    textAlign: "center",
  },

  // Footer
  footer: {
    backgroundColor: "#1f2937",
    marginTop: 40,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  footerContent: {
    alignItems: "center",
  },
  footerLogo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  footerLogoImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 12,
  },
  footerAppName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  footerText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  footerIcons: {
    flexDirection: "row",
    gap: 20,
  },
  footerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
  },
});
