const multer = require('multer');
const path = require('path');

const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];

// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Save files in the 'uploads' directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
    }
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Invalid file type. Only JPEG/JPG and PNG files are allowed.'), false); // Reject the file
    }
};

// Initialize multer with the storage configuration
const upload = multer({ storage: storage,
    fileFilter: fileFilter });

module.exports = upload;