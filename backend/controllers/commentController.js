const Post = require('../models/Post');
const Notification = require('../models/Notification');

// 1. CREATE A COMMENT OR REPLY (Embedded in Post)
exports.createComment = async (req, res) => {
    try {
        const { postId, text, parentCommentId } = req.body;
        
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized: No user data in token" });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const authorName = req.user.name || req.user.username;

        // Create the new comment object for the array
        const newCommentData = {
            user: req.user._id,
            text,
            replies: []
        };

        if (parentCommentId) {
            // SCENARIO A: This is a REPLY
            const parentComment = post.comments.id(parentCommentId);
            if (!parentComment) return res.status(404).json({ message: "Parent comment not found" });

            parentComment.replies.push(newCommentData);

            // Notify original comment author
            if (parentComment.user.toString() !== req.user._id.toString()) {
                await Notification.create({
                    recipient: parentComment.user,
                    sender: req.user._id,
                    type: 'comment',
                    post: postId
                });
            }
        } else {
            // SCENARIO B: This is a NEW TOP-LEVEL COMMENT
            post.comments.push(newCommentData);

            // Notify post author
            if (post.author.toString() !== req.user._id.toString()) {
                await Notification.create({
                    recipient: post.author,
                    sender: req.user._id,
                    type: 'comment',
                    post: postId
                });
            }
        }

        await post.save();
        res.status(201).json(post.comments[post.comments.length - 1]);
    } catch (err) {
        res.status(500).json({ error: "Comment failed.", details: err.message });
    }
};

// 2. GET COMMENTS BY POST
exports.getCommentsByPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId).populate('comments.user', 'name username');
        if (!post) return res.status(404).json({ error: "Post not found." });
        res.status(200).json(post.comments);
    } catch (err) {
        res.status(500).json({ error: "Could not retrieve comments." });
    }
};

// 3. UPDATE A COMMENT
exports.updateComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const comment = post.comments.id(commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        comment.text = req.body.text;
        await post.save();
        res.json(comment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. DELETE A COMMENT
exports.deleteComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        post.comments.pull(commentId); 
        await post.save();
        res.json({ message: "Comment deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};