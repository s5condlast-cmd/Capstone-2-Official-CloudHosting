/**
 * Cloudinary Configuration (Preserved in Comments for Future Reactivation/Redesign)
 *
 * import { v2 as cloudinary } from 'cloudinary';
 * import dotenv from 'dotenv';
 *
 * dotenv.config();
 *
 * if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
 *   console.warn('[Cloudinary Config] Cloudinary credentials missing in environment.');
 * }
 *
 * cloudinary.config({
 *   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
 *   api_key: process.env.CLOUDINARY_API_KEY,
 *   api_secret: process.env.CLOUDINARY_API_SECRET,
 *   secure: true,
 * });
 *
 * export default cloudinary;
 */

import { v2 as cloudinary } from 'cloudinary';

// Preserved dummy configuration to prevent runtime crashes if imported
export default cloudinary;

