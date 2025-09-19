import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_URL } from '../baseURL';

/**
 * Unified profile picture upload utility
 * Handles uploads for admin, provider, and customer profiles
 */
export class ProfileUploadService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Upload profile picture with retry logic and consistent error handling
   * @param {string} imageUri - URI of the selected image
   * @param {string} userType - 'admin', 'provider', or 'customer'
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   * @param {function} onProgress - Progress callback (optional)
   */
  async uploadProfilePicture(imageUri, userType, onSuccess, onError, onProgress = null) {

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        
        const result = await this._performUpload(imageUri, userType, onProgress);
        
        if (result.success) {
          onSuccess(result.data);
          return;
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {        
        if (attempt === this.maxRetries) {
          this._handleFinalError(error, onError);
          return;
        }
        
        // Wait before retry
        await this._delay(this.retryDelay);
      }
    }
  }

  /**
   * Perform the actual upload request
   * @private
   */
  async _performUpload(imageUri, userType, onProgress) {
    try {
      // Get user data and token
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        throw new Error('User not logged in');
      }

      const parsedUser = JSON.parse(userData);
      const token = parsedUser.accessToken;

      if (!token) {
        throw new Error('No authentication token found');
      }


      // Create FormData
      const formData = new FormData();
      formData.append('profilePic', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `profile_${userType}_${Date.now()}.jpg`,
      });


      // Determine endpoint based on user type
      const endpoint = this._getEndpoint(userType);
      
      // Create axios config
      const config = {
        method: 'PUT',
        url: `${API_URL}${endpoint}`,
        data: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: this.timeout,
        onUploadProgress: onProgress ? (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        } : undefined,
      };


      const response = await axios(config);


      if (response.status === 200 && response.data.success) {
        // Update stored user data
        const updatedUserData = {
          ...parsedUser,
          [userType === 'customer' ? 'userData' : `${userType}Data`]: response.data.data,
        };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));

        return {
          success: true,
          data: response.data.data,
        };
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get the correct endpoint for user type
   * @private
   */
  _getEndpoint(userType) {
    switch (userType) {
      case 'admin':
        return '/admin/profile-pic';
      case 'provider':
        return '/users/provider/profile-pic';
      case 'customer':
        return '/users/profile-pic';
      default:
        throw new Error(`Invalid user type: ${userType}`);
    }
  }

  /**
   * Handle final error after all retries
   * @private
   */
  _handleFinalError(error, onError) {
    let errorMessage = 'Failed to upload profile picture. Please try again.';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Upload timeout. Please check your internet connection and try again.';
    } else if (error.response?.status === 401) {
      errorMessage = 'Session expired. Please login again.';
    } else if (error.response?.status === 413) {
      errorMessage = 'Image file is too large. Please select a smaller image.';
    } else if (error.response?.status === 415) {
      errorMessage = 'Invalid file type. Please select a valid image file.';
    } else if (error.message?.includes('Network Error')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    }

    onError(errorMessage);
  }

  /**
   * Delay utility for retry logic
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Remove profile picture
   * @param {string} userType - 'admin', 'provider', or 'customer'
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  async removeProfilePicture(userType, onSuccess, onError) {
    try {
      
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        throw new Error('User not logged in');
      }

      const parsedUser = JSON.parse(userData);
      const token = parsedUser.accessToken;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const endpoint = this._getEndpoint(userType);
      
      const response = await axios.delete(`${API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: this.timeout,
      });

      if (response.status === 200 && response.data.success) {
        // Update stored user data
        const updatedUserData = {
          ...parsedUser,
          [userType === 'customer' ? 'userData' : `${userType}Data`]: response.data.data,
        };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
        
        onSuccess(response.data.data);
      } else {
        throw new Error(response.data.message || 'Remove failed');
      }
    } catch (error) {
      onError(error.message || 'Failed to remove profile picture');
    }
  }
}

// Export singleton instance
export const profileUploadService = new ProfileUploadService();
