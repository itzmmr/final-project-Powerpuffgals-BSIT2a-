const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// POST a comment (Protected)
router.post('/', protect, commentController.createComment);

// GET comments for a post (Public)
router.get('/:postId', commentController.getCommentsByPost);

module.exports = router;