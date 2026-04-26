const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // The user who receives the notification
    recipient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // The user who triggered the action
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // The type of activity
    type: { 
        type: String, 
        enum: ['like', 'follow', 'comment', 'reply'], // Added 'reply' to be more specific
        required: true 
    },
    // Link to the post involved (optional for 'follow' types)
    post: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post' 
    },
    // Track if the user has seen it
    isRead: { 
        type: Boolean, 
        default: false 
    },
}, { 
    timestamps: true // Automatically adds 'createdAt' and 'updatedAt'
});

// Optimization: Indexing helps fetch notifications faster as your user base grows
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);