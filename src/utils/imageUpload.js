/**
 * Convert file to base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove data:image/...;base64, prefix
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Convert multiple files to base64
 * @param {FileList} files - The files to convert
 * @returns {Promise<string[]>} Array of base64 strings
 */
export const filesToBase64 = async (files) => {
  const promises = Array.from(files).map(file => fileToBase64(file));
  return Promise.all(promises);
};

/**
 * Validate image file
 * @param {File} file - The file to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateImageFile = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Maximum size is 5MB.' };
  }

  return { valid: true };
};

/**
 * Get base64 image URL for display
 * @param {string} base64Data - Base64 string
 * @param {string} mimeType - MIME type (default: image/jpeg)
 * @returns {string} Data URL
 */
export const getBase64ImageUrl = (base64Data, mimeType = 'image/jpeg') => {
  return `data:${mimeType};base64,${base64Data}`;
};
