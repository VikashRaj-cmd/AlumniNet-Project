// TODO: MANUAL SETUP REQUIRED — See manual_setup.md in root directory (Section 7: Cloudinary Setup)
// Cloud storage configuration for profile images and PDF resumes using Cloudinary.
// If Cloudinary keys are not configured in .env, falls back gracefully to local disk storage (./uploads).

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const config = require('./config');

let isCloudinaryConfigured = false;

// Initialize Cloudinary if environment variables exist
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  isCloudinaryConfigured = true;
  console.log('[STORAGE] Cloudinary configured successfully');
} else {
  console.log('[STORAGE] Cloudinary credentials missing. Falling back to local disk storage (./uploads)');
}

/**
 * Upload a file to Cloudinary (or return relative local path if Cloudinary is offline)
 * @param {string} filePath - Absolute path to local file
 * @param {string} folder - Destination folder name (e.g. 'alumninet/avatars', 'alumninet/resumes')
 * @returns {Promise<string>} Public URL of uploaded file
 */
const uploadToCloud = async (filePath, folder = 'alumninet/uploads') => {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: 'auto',
      });
      // Remove local temp file after cloud upload succeeds
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return result.secure_url;
    } catch (err) {
      console.error(`[STORAGE] Cloudinary upload error: ${err.message}. Falling back to local URL.`);
    }
  }

  // Fallback to relative local URL path
  const filename = path.basename(filePath);
  return `/uploads/${filename}`;
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadToCloud,
};
