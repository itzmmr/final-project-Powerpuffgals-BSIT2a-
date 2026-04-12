const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    // Link to the Post being commented on
    postId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post', 
        required: true 
    },
    // The name of the person (for quick display)
    author: { 
        type: String, 
        required: true 
    },
    // Link to the User's account (Crucial for profile linking!)
    authorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    text: { 
        type: String, 
        required: true 
    },
    // For Replies: Points back to the original comment
    parentCommentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment', 
        default: null 
    },
    // Array of IDs pointing to all replies for this specific comment
    replies: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment' 
    }]
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);