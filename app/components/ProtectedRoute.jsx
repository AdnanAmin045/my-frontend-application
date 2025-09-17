// components/ProtectedRoute.jsx
import { useAuth } from '../context/authContext';
import { useRouter } from 'expo-router';
import { ActivityIndicator, View, Text } from 'react-native';
import { useEffect } from 'react';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  console.log("Required: ",user)
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/login');
        return;
      }
      
      // Check if user has the required role
      if (requiredRole && user.role !== requiredRole) {
        // Redirect based on user's actual role
        if (user.role === 'Admin') {
          router.replace('/adminDashboard');
        } else if (user.role === 'provider') {
          router.replace('/providerDashboard');
        } else {
          router.replace('/userDashboard');
        }
      }
    }
  }, [user, loading, requiredRole]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user || (requiredRole && user.role !== requiredRole)) {
    return null; // Will redirect in useEffect
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on user role
      if (user.role === 'Admin') {
        router.replace('/adminDashboard');
      } else if (user.role === 'provider') {
        router.replace('/providerDashboard');
      } else {
        router.replace('/userDashboard');
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (user) {
    return null; // Will redirect in useEffect
  }

  return children;
};

export default ProtectedRoute;