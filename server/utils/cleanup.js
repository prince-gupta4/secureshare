const fs = require('fs');
const path = require('path');
const FileModel = require('../models/File');
const { deleteFromCloudinary } = require('./cloudinary');
const { log } = require('./logger');

/**
 * Delete expired files from local disk, Cloudinary, and the database.
 * Runs on a schedule (every 15 min) and also on server start.
 *
 * @returns {Promise<{deleted: number, errors: number}>}
 */
async function cleanupExpiredFiles() {
  const now = new Date();
  const expired = await FileModel.find({ expiresAt: { $lte: now } });

  let deleted = 0;
  let errors = 0;

  for (const file of expired) {
    try {
      // Delete local file
      const fullPath = path.resolve(__dirname, '..', file.filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      // Delete from Cloudinary
      if (file.cloudinaryPublicId) {
        await deleteFromCloudinary(file.cloudinaryPublicId);
      }

      // Delete database record
      await FileModel.deleteOne({ _id: file._id });
      deleted += 1;
    } catch (err) {
      errors += 1;
      console.error(`Cleanup failed for file ${file.slug}:`, err.message);
      log({
        level: 'ERROR',
        message: `Cleanup failed for file ${file.slug}`,
        error: err.message,
        slug: file.slug,
      });
    }
  }

  return { deleted, errors };
}

module.exports = { cleanupExpiredFiles };