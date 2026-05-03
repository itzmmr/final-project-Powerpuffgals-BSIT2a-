// routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// Standard creation and fetching
router.post('/', protect, commentController.createComment);
router.get('/:postId', commentController.getCommentsByPost);

// FIX: Ensure these match the frontend call structure exactly
// The frontend is sending: /api/comments/POST_ID/comment/COMMENT_ID
router.put('/:postId/comment/:commentId', protect, commentController.updateComment); 
router.delete('/:postId/comment/:commentId', protect, commentController.deleteComment);

module.exports = router;