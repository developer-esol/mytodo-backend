const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const logger = require("../config/logger");

// Single shared S3 client instance
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function buildPublicUrl(key) {
  // Virtual-hosted–style URL
  // NOTE: For some regions (e.g. us-east-1) the pattern is the same.
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Upload a raw Buffer to S3 and return its public URL.
 * @param {Buffer} buffer - File data
 * @param {string} mimeType - MIME type (e.g. image/png)
 * @param {string} folder - Sub-folder inside bucket (e.g. 'tasks')
 * @returns {Promise<string>} Public URL
 */
async function uploadBuffer(buffer, mimeType, folder = "misc") {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("uploadBuffer: buffer must be a valid Buffer");
  }
  if (!process.env.AWS_BUCKET_NAME) {
    throw new Error("Missing AWS_BUCKET_NAME env variable");
  }
  const ext =
    mimeType && mimeType.includes("/") ? mimeType.split("/")[1] : "dat";
  const key = `${folder}/${crypto.randomBytes(16).toString("hex")}.${ext}`;

  try {
    const putParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType || "application/octet-stream",
      CacheControl: "public, max-age=31536000",
    };
    await s3.send(new PutObjectCommand(putParams));
    const url = buildPublicUrl(key);
    logger.info("S3 upload complete", {
      file: "utils/imageUpload.js",
      function: "uploadBuffer",
      key,
      url,
      mimeType,
      size: buffer.length,
    });
    return url;
  } catch (err) {
    logger.error("S3 upload failed", {
      file: "utils/imageUpload.js",
      function: "uploadBuffer",
      error: err.message,
      stack: err.stack,
    });
    throw new Error("Failed to upload file to S3");
  }
}

/**
 * Convert an array of base64 data URLs to S3 uploads.
 * @param {string[]} base64Array - Array of data URLs (data:image/png;base64,....)
 * @param {object} options
 * @param {string} options.folder - Destination folder
 * @returns {Promise<string[]>} Array of public URLs
 */
async function uploadBase64Array(base64Array, { folder = "tasks" } = {}) {
  if (!Array.isArray(base64Array)) return [];

  const dataUrlRegex = /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/;
  const uploads = base64Array.map(async (dataUrl, idx) => {
    const match = dataUrl.match(dataUrlRegex);
    if (!match) {
      logger.warn("Skipping non-base64 image string", {
        file: "utils/imageUpload.js",
        function: "uploadBase64Array",
        index: idx,
        sample: dataUrl.substring(0, 30),
      });
      return null;
    }
    const mimeType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");

    // Basic size guard: reject > 10MB
    if (buffer.length > 10 * 1024 * 1024) {
      logger.warn("Image too large, skipping", {
        file: "utils/imageUpload.js",
        function: "uploadBase64Array",
        index: idx,
        size: buffer.length,
      });
      return null;
    }

    return uploadBuffer(buffer, mimeType, folder);
  });

  const results = await Promise.all(uploads);
  return results.filter(Boolean);
}

module.exports = {
  uploadBuffer,
  uploadBase64Array,
  buildPublicUrl,
  s3Client: s3,
};
