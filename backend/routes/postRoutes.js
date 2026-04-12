const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const upload = require('../config/cloudinary'); 
const { protect } = require('../middleware/authMiddleware');

// --- 1. POST OPERATIONS ---
router.post('/', protect, upload.single('image'), postController.createPost);
router.get('/', postController.getAllPosts);

// --- 2. DISCOVERY ---
router.get('/search', postController.searchPosts);
router.get('/following-feed', protect, postController.getFollowingFeed);

// --- 3. ENGAGEMENT ---
router.put('/like/:id', protect, postController.likePost);

// --- 4. EDIT & DELETE (Ownership Protected) ---
router.put('/:id', protect, upload.single('image'), postController.updatePost);
router.delete('/:id', protect, postController.deletePost);

// --- 5. DATA FETCHING ---
router.get('/:id', postController.getPostById);

module.exports = router;