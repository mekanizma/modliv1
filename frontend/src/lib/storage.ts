import axios from 'axios';
import { supabase } from './supabase';

export interface UploadResult {
  success: boolean;
  fullUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

/**
 * Upload image to Supabase Storage via backend
 * Returns URLs for both full and thumbnail images
 * Requires valid Supabase JWT token
 */
export async function uploadImageToStorage(
  fileUri: string,
  userId: string,
  bucket: 'wardrobe' | 'profiles' = 'wardrobe',
  filename?: string,
  mimeType: string = 'image/jpeg'
): Promise<UploadResult> {
  try {
    const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL as string;

    // Get Supabase session token - retry if session is not ready
    let session = null;
    let retries = 3;
    
    while (retries > 0) {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        retries--;
        if (retries > 0) {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        return {
          success: false,
          error: 'Authentication error. Please try logging in again.',
        };
      }
      
      session = data.session;
      
      if (session && session.access_token) {
        break;
      }
      
      retries--;
      if (retries > 0) {
        console.log('Session not ready, retrying...');
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (!session || !session.access_token) {
      return {
        success: false,
        error: 'Authentication required. Please login first.',
      };
    }

    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: `${filename || `upload_${Date.now()}`}.jpg`,
      type: mimeType,
    } as any);
    formData.append('bucket', bucket);
    formData.append('user_id', userId);
    if (filename) {
      formData.append('filename', filename);
    }

    const response = await axios.post(
      `${EXPO_PUBLIC_BACKEND_URL}/api/upload-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${session.access_token}`,
        },
        timeout: 30000, // 30 second timeout
      }
    );

    return {
      success: response.data.success,
      fullUrl: response.data.full_url,
      thumbnailUrl: response.data.thumbnail_url,
      error: response.data.error,
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    
    // Handle 401 Unauthorized specifically
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Authentication expired. Please try again.',
      };
    }
    
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Upload failed',
    };
  }
}

/**
 * Extract filename from a URL
 */
export function getFilenameFromUrl(url: string): string {
  return url.split('/').pop() || 'unknown';
}

