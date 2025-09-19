import { useState } from 'react';
import { Alert } from 'react-native';
import { profileUploadService } from '../utils/profileUpload';

/**
 * Custom hook for profile picture uploads
 * Provides consistent upload functionality across all user types
 */
export const useProfileUpload = (userType) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadProfilePicture = async (imageUri, onSuccess) => {
    if (uploading) {
      Alert.alert("Upload in Progress", "Please wait for the current upload to complete.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      await profileUploadService.uploadProfilePicture(
        imageUri,
        userType,
        // Success callback
        (data) => {
          setUploading(false);
          setUploadProgress(0);
          if (onSuccess) onSuccess(data);
          Alert.alert("Success", "Profile picture updated successfully!");
        },
        // Error callback
        (errorMessage) => {
          setUploading(false);
          setUploadProgress(0);
          Alert.alert("Error", errorMessage);
        },
        // Progress callback
        (progress) => {
          setUploadProgress(progress);
(`📤 Upload progress: ${progress}%`);
        }
      );
    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
("❌ Upload hook error:", error);
      Alert.alert("Error", "Failed to upload profile picture. Please try again.");
    }
  };

  const removeProfilePicture = async (onSuccess) => {
    if (uploading) {
      Alert.alert("Upload in Progress", "Please wait for the current upload to complete.");
      return;
    }

    Alert.alert(
      "Remove Profile Picture",
      "Are you sure you want to remove your profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setUploading(true);
            try {
              await profileUploadService.removeProfilePicture(
                userType,
                // Success callback
                (data) => {
                  setUploading(false);
                  if (onSuccess) onSuccess(data);
                  Alert.alert("Success", "Profile picture removed successfully!");
                },
                // Error callback
                (errorMessage) => {
                  setUploading(false);
                  Alert.alert("Error", errorMessage);
                }
              );
            } catch (error) {
              setUploading(false);
("❌ Remove profile picture error:", error);
              Alert.alert("Error", "Failed to remove profile picture");
            }
          },
        },
      ]
    );
  };

  return {
    uploading,
    uploadProgress,
    uploadProfilePicture,
    removeProfilePicture,
  };
};
