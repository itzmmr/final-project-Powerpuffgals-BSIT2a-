const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const upload = require('../config/cloudinary'); 
const { protect } = require('../middleware/authMiddleware');

// 1. Static/Specific Routes (ON TOP)
router.get('/', postController.getAllPosts);
router.get('/search', postController.searchPosts);
router.get('/following-feed', protect, postController.getFollowingFeed);

// 2. Specialized parameter routes
router.get('/user/:id', protect, postController.getUserPosts);

// 3. Action routes
router.put('/like/:id', protect, postController.likePost);
router.post('/:id/comment', protect, postController.addComment);
router.post('/:id/comment/:commentId/reply', protect, postController.addReply);
router.delete('/:id/comment/:commentId', protect, postController.deleteComment);
router.put('/:id/comment/:commentId/like', protect, postController.likeComment); 

// 4. General Parameter Routes (AT THE BOTTOM)
router.get('/:id', postController.getPostById);
router.post('/', protect, upload.single('image'), postController.createPost);
router.put('/:id', protect, upload.single('image'), postController.updatePost);
router.delete('/:id', protect, postController.deletePost);

module.exports = router;