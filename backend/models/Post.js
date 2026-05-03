const mongoose = require('mongoose');

// 1. Define the structure for comments and replies
const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

// 2. Recursive Fix: This allows replies to have their own replies array
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

// --- START OF UPDATED FIX FOR NAMES ---
// This handles the "Unlimited" feel by populating deep into the replies
const autoPopulateUser = function(next) {
    // 1. Create a helper function that can nest itself infinitely
    const populateLevel = (depth) => {
        if (depth <= 0) return { path: 'user', select: 'name avatar' };
        
        return {
            path: 'replies',
            populate: [
                { path: 'user', select: 'name avatar' },
                populateLevel(depth - 1) // This "dives" one level deeper
            ]
        };
    };

    // 2. Apply the recursive population to the main query
    this.populate([
        { path: 'author', select: 'name avatar' },
        { 
            path: 'comments',
            populate: [
                { path: 'user', select: 'name avatar' },
                populateLevel(10) // This ensures names show up even 10+ replies deep
            ]
        }
    ]);

    if (typeof next === 'function') {
        next();
    }
};

// Apply the middleware to find queries so names always show up
postSchema.pre('find', autoPopulateUser);
postSchema.pre('findOne', autoPopulateUser);
// --- END OF ADDED FIX ---

module.exports = mongoose.model('Post', postSchema);