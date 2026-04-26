const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); 
const upload = require('../config/cloudinary'); 
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User'); 

// --- 1. AUTHENTICATION & REGISTRATION ---

// Standard registration and login routes
router.post('/', upload.single('avatar'), userController.register); 
router.post('/register', upload.single('avatar'), userController.register);
router.post('/login', userController.login);


// --- 2. USER PROFILE & PRIVATE DATA ---

// Get current logged-in user data
router.get('/me', protect, (req, res) => {
    if (!req.user) return res.status(404).json({ message: "User not found" });
    res.json(req.user);
});

/**
 * FIXED: Update profile settings
 * This route now handles EVERYTHING: Avatar, Bio, Theme, Role, and GitHub.
 * It uses the controller we updated to handle age gating and sanitization.
 */
router.put('/update', protect, upload.single('avatar'), userController.updateUserProfile);

// Get profile statistics (Post count, Followers, Following)
router.get('/stats/:id', protect, userController.getUserStats);

// Public profile view 
router.get('/profile/:id', userController.getUserProfile);


// --- 3. SOCIAL & DISCOVERY ---

// Search for other IT students/professionals
router.get('/search', userController.searchUsers);

// Follow/Unfollow toggle
router.post('/follow/:id', protect, userController.toggleFollow);


// --- 4. DEVELOPMENT & DEBUGGING ---

// List all users (remove before final deployment)
router.get('/list', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;