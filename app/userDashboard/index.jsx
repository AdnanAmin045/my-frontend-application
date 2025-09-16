import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function UserDashboardScreen() {
  const router = useRouter();

  const dashboardItems = [
    {
      title: 'My Orders',
      description: 'View and manage your orders',
      route: '/userDashboard/orders',
      colors: ['#10B981', '#34D399'],
      icon: 'cube-outline',
    },
    {
      title: 'Explore Services',
      description: 'Browse available tailoring services',
      route: '/userDashboard/explore',
      colors: ['#8B5CF6', '#A78BFA'],
      icon: 'search-outline',
    },
    {
      title: 'Profile',
      description: 'Manage your account settings',
      route: '/userDashboard/profile',
      colors: ['#F59E0B', '#FBBF24'],
      icon: 'person-outline',
    },
  ];


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome back! How can we assist you today?</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.grid}>
          {dashboardItems.map((item, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(index * 100).duration(500)}
              style={styles.cardContainer}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push(item.route)}
              >
                <LinearGradient
                  colors={item.colors}
                  style={styles.card}
                >
                  <Ionicons name={item.icon} size={32} color="#fff" style={styles.cardIcon} />
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDescription}>{item.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'System',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: '48%',
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'System',
  },
  cardDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'System',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    fontFamily: 'System',
  },
  statsContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'System',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  activityContainer: {
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    fontFamily: 'System',
  },
  activityTime: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'System',
  },
});