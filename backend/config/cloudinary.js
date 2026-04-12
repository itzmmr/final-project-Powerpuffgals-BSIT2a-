const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Debugging to ensure .env is loading
console.log("Cloud Name Check:", process.env.CLOUDINARY_CLOUD_NAME);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        // This dynamic approach is more reliable
        return {
            folder: 'nexus_writes',
            // Setting format to undefined lets Cloudinary keep the original extension
            format: undefined, 
            resource_type: 'auto',
            public_id: file.originalname.split('.')[0] + '-' + Date.now(),
        };
    },
});

const upload = multer({ storage: storage });
module.exports = upload;