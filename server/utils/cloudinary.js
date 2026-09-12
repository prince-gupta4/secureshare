const cloudinary = require('cloudinary').v2;

// Configure Cloudinary from environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Local path of the file to upload
 * @param {string} publicId - Public ID for the file (e.g. slug)
 * @returns {Promise<{url: string, publicId: string}>}
 */
async function uploadToCloudinary(filePath, publicId) {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            public_id: publicId,
            resource_type: 'raw',
            folder: 'securestore',
            overwrite: true,
        });
        return { url: result.secure_url, publicId: result.public_id };
    } catch (err) {
        console.error('Cloudinary upload error:', err.message);
        throw err;
    }
}

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 */
async function deleteFromCloudinary(publicId) {
    try {
        if (!publicId) return;
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    } catch (err) {
        console.error('Cloudinary delete error:', err.message);
    }
}

module.exports = { uploadToCloudinary, deleteFromCloudinary, cloudinary };