const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

// 1. CREATE A NEW POST
exports.createPost = async (req, res) => {
    try {
        const { title, content, category } = req.body;
        if (!title || !content) return res.status(400).json({ error: "Required fields missing" });

        const newPost = new Post({
            title, 
            content, 
            author: req.user._id,
            // Fallback to "General" if no category provided (matches your ERD logic)
            category: category || "General", 
            image: req.file ? req.file.path : null
        });
        
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. GET ALL POSTS (Global Feed)
exports.getAllPosts = async (req, res) => {
    try {
        // Populating more fields for the "Settings" and Profile views
        const posts = await Post.find()
            .populate('author', 'name avatar bio githubUsername')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. SEARCH POSTS
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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. LIKE / UNLIKE POST
exports.likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const isLiked = post.likes.includes(req.user._id);
        if (isLiked) {
            post.likes = post.likes.filter((uid) => uid.toString() !== req.user._id.toString());
        } else {
            post.likes.push(req.user._id);
            if (post.author.toString() !== req.user._id.toString()) {
                await Notification.create({
                    recipient: post.author,
                    sender: req.user._id,
                    type: 'like',
                    post: post._id
                });
            }
        }
        await post.save();
        res.json({ likesCount: post.likes.length, isLiked: !isLiked });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. GET FOLLOWING FEED
exports.getFollowingFeed = async (req, res) => {
    try {
        const posts = await Post.find({ author: { $in: req.user.following } })
            .populate('author', 'name avatar bio')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 6. EDIT POST (Evolution)
exports.updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        // Ownership Check
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Unauthorized: You can only edit your own posts." });
        }

        post.title = req.body.title || post.title;
        post.content = req.body.content || post.content;
        post.category = req.body.category || post.category;
        
        if (req.file) post.image = req.file.path;

        const updatedPost = await post.save();
        res.json({ message: "Post updated! ✨", post: updatedPost });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 7. DELETE POST (Garbage Collection)
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Unauthorized: You can only delete your own posts." });
        }

        await post.deleteOne();
        await Notification.deleteMany({ post: req.params.id }); 
        res.json({ message: "Post deleted from the ecosystem. 🌿" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 8. GET SINGLE POST BY ID
exports.getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'name avatar bio githubUsername interests');
        if (!post) return res.status(404).json({ message: "Post not found" });
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};