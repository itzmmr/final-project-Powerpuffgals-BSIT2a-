const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// 1. CREATE A COMMENT OR REPLY
exports.createComment = async (req, res) => {
    try {
        const { postId, text, parentCommentId } = req.body;
        
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized: No user data in token" });
        }

        // Find the post to know who the author is for the notification
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const authorName = req.user.name || req.user.username;

        if (!authorName) {
            console.error("❌ Auth Error: req.user exists but 'name' and 'username' are missing.");
            return res.status(400).json({ error: "User profile is missing a name/username field." });
        }

        const newComment = new Comment({
            postId,
            author: authorName, 
            authorId: req.user._id, 
            text,
            parentCommentId: parentCommentId || null
        });

        const savedComment = await newComment.save();

        // --- NOTIFICATION LOGIC START ---
        
        if (parentCommentId) {
            // SCENARIO A: This is a REPLY
            const parentComment = await Comment.findById(parentCommentId);
            
            await Comment.findByIdAndUpdate(parentCommentId, {
                $push: { replies: savedComment._id }
            });

            // Notify the author of the original comment (if it's not the same person)
            if (parentComment && parentComment.authorId.toString() !== req.user._id.toString()) {
                await Notification.create({
                    recipient: parentComment.authorId,
                    sender: req.user._id,
                    type: 'comment', // You can add 'reply' to your enum in Notification.js if you want more detail
                    post: postId
                });
            }
            console.log(`↩️  ${authorName} replied to comment ${parentCommentId}`);

        } else {
            // SCENARIO B: This is a NEW COMMENT on a post
            // Notify the post author (if it's not the same person)
            if (post.author.toString() !== req.user._id.toString()) {
                await Notification.create({
                    recipient: post.author,
                    sender: req.user._id,
                    type: 'comment',
                    post: postId
                });
            }
            console.log(`💬 ${authorName} commented on post: ${postId}`);
        }

        // --- NOTIFICATION LOGIC END ---

        res.status(201).json(savedComment);
    } catch (err) {
        console.error("❌ Comment Error Details:", err);
        res.status(500).json({ 
            error: "Comment validation failed.", 
            details: err.message 
        });
    }
};

// 2. GET COMMENTS BY POST (Threaded View)
exports.getCommentsByPost = async (req, res) => {
    try {
        const comments = await Comment.find({ 
            postId: req.params.postId, 
            parentCommentId: null 
        })
        .populate({
            path: 'replies',
            populate: { path: 'replies' } 
        })
        .sort({ createdAt: -1 }); 

        res.status(200).json(comments);
    } catch (err) {
        console.error("❌ Fetch Error:", err.message);
        res.status(500).json({ error: "Could not retrieve comments." });
    }
};