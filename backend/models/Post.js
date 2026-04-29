const mongoose = require('mongoose');

// Define the structure first
const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

// THE RECURSIVE FIX: This allows replies to have their own replies array
commentSchema.add({
    replies: [commentSchema] 
});

const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }, 
    image: { type: String, default: null },
    tags: { type: [String], default: [] },
    category: { type: String, default: "General" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema] 
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);