const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/uploads/questions');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WEBP images are allowed.'), false);
  }
};
//add when working in resources
const resourceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/uploads/resources');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const resourceFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, PPT, and PPTX files are allowed.'), false);
  }
};

const uploadResource = multer({
  storage: resourceStorage,
  fileFilter: resourceFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB — documents can be larger than images
});

function buildResourceUrl(filename) {
  return `/uploads/resources/${filename}`;
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

function buildFileUrl(filename) {
  return `/uploads/questions/${filename}`;
}

module.exports = { upload, buildFileUrl, uploadResource, buildResourceUrl };