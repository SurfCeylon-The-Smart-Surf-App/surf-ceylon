/**
 * Image Utility Functions
 * Helper functions for image compression and manipulation
 */

/**
 * Compress base64 image string by reducing quality
 * This is a simple approach - for better compression, use a native library
 * @param {string} base64
 * @param {number} [maxSizeKB=200]
 * @returns {string}
 */
export const compressBase64Image = (base64, maxSizeKB = 200) => {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  
  // Estimate size (rough approximation: base64 is ~33% larger than binary)
  const sizeKB = (base64Data.length * 3) / 4 / 1024;
  
  if (sizeKB <= maxSizeKB) {
    return base64Data;
  }
  
  // If too large, we'll need to resize on the server side
  // For now, return as-is and let the backend handle it
  // In production, use react-native-image-resizer or similar
  return base64Data;
};

/**
 * Convert image URI to base64 with compression
 * @param {string} uri
 * @returns {Promise<string>}
 */
export const imageUriToBase64 = async (uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`Failed to convert image to base64: ${error}`);
  }
};

