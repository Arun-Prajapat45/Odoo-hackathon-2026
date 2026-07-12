import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer directly to Cloudinary.
 * @param {Buffer} fileBuffer - The binary file contents.
 * @param {string} folder - Destination folder on Cloudinary.
 * @returns {Promise<string>} The secure HTTPS url of the uploaded file.
 */
export async function uploadToCloudinary(fileBuffer, folder = 'transitops') {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { 
        folder, 
        resource_type: 'auto' // Autodetects pdf, png, jpg, etc.
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    ).end(fileBuffer);
  });
}

/**
 * Extracts the public ID from a Cloudinary URL.
 * @param {string} url - The full secure url.
 * @returns {string|null} The parsed public ID or null.
 */
export function getPublicIdFromUrl(url) {
  try {
    if (!url || !url.includes('/upload/')) return null;
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    
    // Remove the version tag (e.g. v16752003/ or v1/) if present
    const pathPart = parts[1].replace(/^v\d+\//, ''); 
    
    // Remove the file extension (e.g., .pdf, .png)
    const extensionIndex = pathPart.lastIndexOf('.');
    if (extensionIndex === -1) return pathPart;
    return pathPart.substring(0, extensionIndex);
  } catch (e) {
    console.error('Failed to parse public ID from Cloudinary URL:', e);
    return null;
  }
}

/**
 * Deletes a file from Cloudinary by its URL.
 * @param {string} url - The full secure url of the document.
 * @returns {Promise<boolean>} Success status.
 */
export async function deleteFromCloudinary(url) {
  try {
    const publicId = getPublicIdFromUrl(url);
    if (!publicId) return false;
    
    // Cloudinary destroy requires the resource type if it's not an 'image'
    // Storing PDF/docs requires resource_type: 'raw' or matching type.
    // For auto-uploaded resources, let's try image first or raw if it's not a standard image.
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    const options = { resource_type: isImage ? 'image' : 'raw' };
    
    const result = await cloudinary.uploader.destroy(publicId, options);
    console.log(`Cloudinary delete result for ${publicId}:`, result);
    return result.result === 'ok';
  } catch (error) {
    console.error('Failed to delete from Cloudinary:', error);
    return false;
  }
}
