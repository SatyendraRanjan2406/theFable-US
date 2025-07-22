import { toast } from 'sonner';
import { BASE_URL } from '@/config/api';

export interface PresignedUrlResponse {
  upload_id: string;
  presigned_url: string;
  file_key: string;
  bucket_name: string;
  filename: string;
  content_type: string;
  purpose: string;
  expires_at: string;
  created_at: string;
  upload_instructions: {
    method: string;
    url: string;
    headers: {
      'Content-Type': string;
    };
    note: string;
  };
}

export interface S3UploadResult {
  success: boolean;
  imageUrl?: string;
  uploadId?: string;
  error?: string;
}

// Get MIME type from file
const getContentType = (file: File): string => {
  return file.type || 'application/octet-stream';
};

// Step 1: Get presigned URL from backend
const getPresignedUrl = async (
  filename: string,
  contentType: string,
  fileSize: number
): Promise<PresignedUrlResponse> => {
  const response = await fetch(`${BASE_URL}/api/aws/upload/generate-url/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: filename,
      content_type: contentType,
      file_size: fileSize,
      purpose: 'document',
      method: 'PUT'
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to get presigned URL: ${response.status}`);
  }

  return await response.json();
};

// Step 2: Upload file to S3 using presigned URL
const uploadToS3 = async (
  file: File,
  presignedUrl: string,
  contentType: string
): Promise<void> => {
  console.log('Uploading to S3:', { presignedUrl, contentType, fileSize: file.size });
  
  try {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: file,
      mode: 'cors', // Explicitly set CORS mode
    });

    console.log('S3 response status:', response.status, response.statusText);

    if (!response.ok) {
      const responseText = await response.text().catch(() => 'No response text');
      console.error('S3 upload error response:', responseText);
      throw new Error(`S3 upload failed: ${response.status} ${response.statusText} - ${responseText}`);
    }
    
    console.log('S3 upload successful');
  } catch (error) {
    console.error('S3 upload fetch error:', error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to upload to S3. Please check your internet connection.');
    }
    throw error;
  }
};

// Step 3: Confirm upload and get public URL
const confirmUpload = async (uploadId: string): Promise<string> => {
  const response = await fetch(`${BASE_URL}/api/aws/upload/confirm/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      upload_id: uploadId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to confirm upload: ${response.status}`);
  }

  const data = await response.json();
  return data.public_url || data.imageUrl || data.url;
};

// Main upload function that orchestrates the entire flow
export const uploadImageToS3 = async (file: File): Promise<S3UploadResult> => {
  try {
    // Validate file
    if (!validateImageFile(file)) {
      throw new Error('Invalid image file');
    }

    const contentType = getContentType(file);
    const filename = file.name;
    const fileSize = file.size;

    console.log('Starting S3 upload:', { filename, contentType, fileSize });

    // Step 1: Get presigned URL
    toast.info('Preparing upload...');
    const presignedResponse = await getPresignedUrl(filename, contentType, fileSize);
    
    console.log('Got presigned URL:', presignedResponse);
    const { upload_id, presigned_url, upload_instructions } = presignedResponse;

    // Step 2: Upload to S3
    toast.info('Uploading to cloud storage...');
    try {
      await uploadToS3(file, presigned_url, upload_instructions.headers['Content-Type']);
    } catch (uploadError) {
      console.error('Upload to S3 failed:', uploadError);
      toast.error('Failed to upload to cloud storage');
      throw uploadError;
    }
    
    console.log('Upload to S3 completed');

    // Step 3: Confirm upload and get public URL
    toast.info('Finalizing upload...');
    const publicUrl = await confirmUpload(upload_id);
    
    console.log('Upload confirmed, public URL:', publicUrl);

    return {
      success: true,
      imageUrl: publicUrl,
      uploadId: upload_id,
    };

  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

// Utility to check if a file is a valid image
export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    toast.error('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
    return false;
  }

  if (file.size > maxSize) {
    toast.error('Image file must be smaller than 10MB');
    return false;
  }

  return true;
};

// Utility to compress image before upload if needed
export const compressImageForUpload = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions (max 1920px on longest side)
      const maxDimension = 1920;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        0.85 // Good quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}; 