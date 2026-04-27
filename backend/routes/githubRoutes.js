const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');

// URL: /api/github/:username
router.get('/:username', githubController.getUserRepos);

module.exports = router; 
 