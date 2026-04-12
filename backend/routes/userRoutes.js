const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); 
const upload = require('../config/cloudinary'); 
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User'); 

// 1. AUTH
router.post('/register', upload.single('avatar'), userController.register);
router.post('/login', userController.login);

// 2. SEARCH & STATS
router.get('/search', userController.searchUsers);
router.get('/stats', protect, userController.getUserStats); 
router.get('/friends', protect, userController.getFriends);
router.get('/me', protect, (req, res) => res.json(req.user));

// 3. PROFILE UPDATES (Use this URL: /api/users/update)
router.put('/update', protect, upload.single('avatar'), userController.updateUserProfile);
router.put('/follow/:id', protect, userController.toggleFollow);

// 4. DYNAMIC PROFILE
router.get('/profile/:id', userController.getUserProfile);

// 5. SYSTEM LIST (Get all users)
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;