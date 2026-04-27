const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

const findCommentDeep = (comments, id) => {
    for (let c of comments) {
        if (c._id.toString() === id.toString()) return c;
        if (c.replies && c.replies.length > 0) {
            const found = findCommentDeep(c.replies, id);
            if (found) return found;
        }
    }
    return null;
};

// 1. CREATE A NEW POST
exports.createPost = async (req, res) => {
    try {
        const { title, content, category } = req.body;
        if (!title || !content) return res.status(400).json({ error: "Required fields missing" });
        const newPost = new Post({
            title, content, author: req.user._id,
            category: category || "General",
            image: req.file ? req.file.path : null
        });
        const savedPost = await newPost.save();
        const populatedPost = await Post.findById(savedPost._id).populate('author', 'name avatar bio');
        res.status(201).json(populatedPost);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 2. GET ALL POSTS (Global Feed)
exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'name avatar bio githubUsername')
            .populate({
                path: 'comments',
                populate: [
            { path: 'user', select: 'name avatar' },
            { path: 'replies.user', select: 'name avatar' }
        ]
})
            .sort({ createdAt: -1 });
        res.json(posts || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 3. GET USER POSTS
exports.getUserPosts = async (req, res) => {
    try {
        const posts = await Post.find({ author: req.params.id || req.user._id })
            .populate('author', 'name avatar bio').sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 4. GET FOLLOWING FEED
exports.getFollowingFeed = async (req, res) => {
    try {
        const posts = await Post.find({ author: { $in: [...req.user.following, req.user._id] } })
            .populate('author', 'name avatar bio').sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 5. SEARCH POSTS
exports.searchPosts = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ message: "Search query is empty" });
        const posts = await Post.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { content: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } }
            ]
        }).populate('author', 'name avatar bio');
        res.json(posts);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 6. LIKE / UNLIKE POST
exports.likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const isLiked = post.likes.includes(req.user._id);
        isLiked ? post.likes.pull(req.user._id) : post.likes.push(req.user._id);
        await post.save();

        // --- ADDED TRIGGER ---
        if (!isLiked && post.author.toString() !== req.user._id.toString()) {
            await Notification.create({
                recipient: post.author,
                sender: req.user._id,
                type: 'like',
                post: post._id
            });
        }

        res.json({ likesCount: post.likes.length, isLiked: !isLiked });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 7. EDIT POST
exports.updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.author.toString() !== req.user._id.toString()) return res.status(401).json({ message: "Unauthorized" });
        Object.assign(post, req.body);
        if (req.file) post.image = req.file.path;
        await post.save();
        res.json({ message: "Post updated! ✨", post });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 8. DELETE POST
exports.deletePost = async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: "Post deleted. 🌿" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 9. GET SINGLE POST BY ID
exports.getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'name avatar bio githubUsername')
            .populate('comments.user', 'name avatar');
        res.json(post);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 10. ADD MAIN COMMENT
exports.addComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        post.comments.push({ user: req.user._id, text: req.body.text });
        await post.save();

        // --- ADDED TRIGGER ---
        if (post.author.toString() !== req.user._id.toString()) {
            await Notification.create({
                recipient: post.author,
                sender: req.user._id,
                type: 'comment',
                post: post._id
            });
        }

        const updated = await Post.findById(req.params.id).populate('comments.user', 'name avatar');
        res.status(201).json(updated.comments);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 11. ADD REPLY
exports.addReply = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const parent = findCommentDeep(post.comments, req.params.commentId);
        if (!parent) return res.status(404).json({ message: "Target not found" });

        parent.replies.push({
            user: req.user._id,
            text: req.body.text,
            likes: [],
            replies: [] // Empty array allows the NEXT level of replies
        });

        await post.save();

        // --- ADDED TRIGGER ---
        // Notify the person who wrote the original comment
        if (parent.user.toString() !== req.user._id.toString()) {
            await Notification.create({
                recipient: parent.user,
                sender: req.user._id,
                type: 'comment', // You can add 'reply' to your enum if you want to be specific
                post: post._id
            });
        }
        
        res.status(201).json(post);
    } catch (err) {
        console.error("Reply Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// 12. DELETE COMMENT
exports.deleteComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        post.comments.id(req.params.commentId).deleteOne();
        await post.save();
        res.json({ message: "Comment removed" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// 13. LIKE COMMENT
exports.likeComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const target = findCommentDeep(post.comments, req.params.commentId);
        if (!target) return res.status(404).json({ message: "Comment not found" });

        if (!target.likes) target.likes = [];
        const index = target.likes.indexOf(req.user._id);
        index === -1 ? target.likes.push(req.user._id) : target.likes.splice(index, 1);

        await post.save();
        res.status(200).json(post);
    } catch (err) {
        console.error("Like Error:", err);
        res.status(500).json({ error: err.message });
    }
};