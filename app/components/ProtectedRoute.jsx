// components/ProtectedRoute.jsx
import { useRouter } from 'expo-router';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Role-based Protected Route Component
export const ProtectedRoute = ({ children, requiredRole }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setUserRole(parsedUser.role);
      } else {
        setUser(null);
        setUserRole(null);
      }
    } catch (error) {
      console.log('Error checking auth status:', error);
      setUser(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      // If no user is logged in, redirect to login
      if (!user || !userRole) {
        router.replace('/auth/login');
        return;
      }
      
      // If user has a role but it doesn't match the required role, redirect to appropriate dashboard
      if (requiredRole && userRole !== requiredRole) {
        redirectToUserDashboard(userRole);
      }
    }
  }, [user, userRole, loading, requiredRole]);

  // Function to redirect users to their appropriate dashboard based on role
  const redirectToUserDashboard = (role) => {
    switch (role) {
      case 'Admin':
        router.replace('/adminDashboard');
        break;
      case 'provider':
        router.replace('/providerDashboard');
        break;
      case 'customer':
        router.replace('/userDashboard');
        break;
      default:
        router.replace('/auth/login');
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A63D2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If no user or role doesn't match, don't render anything (redirect will happen)
  if (!user || !userRole || (requiredRole && userRole !== requiredRole)) {
    return null;
  }

  return children;
};

// Public Route Component - blocks access to auth routes when user is logged in
export const PublicRoute = ({ children }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setUserRole(parsedUser.role);
      } else {
        setUser(null);
        setUserRole(null);
      }
    } catch (error) {
      console.log('Error checking auth status:', error);
      setUser(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && user && userRole) {
      // If user is logged in, redirect to appropriate dashboard
      redirectToUserDashboard(userRole);
    }
  }, [user, userRole, loading]);

  // Function to redirect users to their appropriate dashboard based on role
  const redirectToUserDashboard = (role) => {
    switch (role) {
      case 'Admin':
        router.replace('/adminDashboard');
        break;
      case 'provider':
        router.replace('/providerDashboard');
        break;
      case 'customer':
        router.replace('/userDashboard');
        break;
      default:
        // If role is unknown, redirect to login
        router.replace('/auth/login');
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A63D2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If user is logged in, don't render auth pages (redirect will happen)
  if (user && userRole) {
    return null;
  }

  return children;
};

// Role-specific route components for cleaner usage
export const AdminRoute = ({ children }) => {
  return <ProtectedRoute requiredRole="Admin">{children}</ProtectedRoute>;
};

export const ProviderRoute = ({ children }) => {
  return <ProtectedRoute requiredRole="provider">{children}</ProtectedRoute>;
};

export const CustomerRoute = ({ children }) => {
  return <ProtectedRoute requiredRole="customer">{children}</ProtectedRoute>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default ProtectedRoute;