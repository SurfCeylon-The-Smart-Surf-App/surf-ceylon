const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = 'uploads/hazards/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Get extension from original name or derive from mimetype
    let ext = path.extname(file.originalname);
    if (!ext) {
      // Derive extension from mimetype
      const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'video/mp4': '.mp4',
        'video/quicktime': '.mov',
        'video/x-msvideo': '.avi',
      };
      ext = mimeToExt[file.mimetype] || '.jpg';
    }
    cb(null, 'hazard-' + uniqueSuffix + ext);
  }
});

// File filter - more lenient for mobile uploads
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/mov'
  ];
  
  // Check mimetype (more reliable for mobile uploads)
  if (allowedMimeTypes.includes(file.mimetype) || 
      file.mimetype.startsWith('image/') || 
      file.mimetype.startsWith('video/')) {
    return cb(null, true);
  } else {
    console.log('❌ Rejected file:', file.originalname, 'mimetype:', file.mimetype);
    cb(new Error('Only image and video files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: fileFilter
});

module.exports = upload;