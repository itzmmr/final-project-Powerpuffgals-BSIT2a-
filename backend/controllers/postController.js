const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');

// --- HELPER FUNCTIONS ---

/**
 * Recursively finds a comment or reply within the nested structure.
 */
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

/**
 * Recursively deletes a comment or reply by ID within nested arrays.
 * Ensures only the owner of the specific comment can delete it.[cite: 3]
 */
const deleteRecursive = (arr, id, userId) => {
    for (let i = 0; i < arr.length; i++) {
        // Handle both populated objects and plain ID strings for the author check
        const commentAuthorId = arr[i].user._id 
            ? arr[i].user._id.toString() 
            : arr[i].user.toString();

        if (arr[i]._id.toString() === id.toString()) {
            // Permission check: comparing the extracted ID string to the logged-in userId
            if (commentAuthorId !== userId.toString()) {
                return "unauthorized";
            }
            
            arr.splice(i, 1);
            return "deleted";
        }

        if (arr[i].replies && arr[i].replies.length > 0) {
            const result = deleteRecursive(arr[i].replies, id, userId);
            if (result) return result;
        }
    }
    return null;
};
// --- POST ACTIONS ---

// 1. CREATE A NEW POST
exports.createPost = async (req, res) => {
    try {
        const { title, content, category } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: "Required fields missing" });
        }

        // --- FIX: HANDLE THE TAGS ARRAY ---
        let tagsArray = [];
        if (req.body['tags[]']) {
            // If multiple tags are sent, it's an array; if one, make it an array
            tagsArray = Array.isArray(req.body['tags[]']) ? req.body['tags[]'] : [req.body['tags[]']];
        } else if (req.body.tags) {
            // Fallback for different data formats
            tagsArray = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags);
        }

        const newPost = new Post({
            title, 
            content, 
            author: req.user._id,
            category: category || "General",
            tags: tagsArray, // --- ADDED THIS LINE ---
            image: req.file ? req.file.path : null
        });

        const savedPost = await newPost.save();
        
        // Populate so the frontend gets the name and avatar immediately
        const populatedPost = await Post.findById(savedPost._id)
            .populate('author', 'name avatar bio');

        res.status(201).json(populatedPost);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

// 2. GET ALL POSTS (Global Feed) WITH PAGINATION
exports.getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // REMOVED manual .populate() because your Post.js model 
        // now handles this automatically via the .pre('find') middleware!
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPosts = await Post.countDocuments();
        
        res.status(200).json({ 
            posts, 
            currentPage: page, 
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts,
            limit
        });
    } catch (err) { 
        console.error("Fetch Error:", err.message);
        res.status(500).json({ error: err.message }); 
    }
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
        
        // Toggle the like
        isLiked ? post.likes.pull(req.user._id) : post.likes.push(req.user._id);
        await post.save();

        // --- THE BULLETPROOF FIX ---
        // 1. Convert IDs to strings explicitly
        const postAuthorId = post.author._id ? post.author._id.toString() : post.author.toString();
        const currentUserId = req.user._id.toString();

        // 2. Only notify if:
        //    - It's a NEW like (!isLiked)
        //    - I am NOT the author of the post (postAuthorId !== currentUserId)
        if (!isLiked && postAuthorId !== currentUserId) {
            await Notification.create({
                recipient: post.author,
                sender: req.user._id,
                type: 'like',
                post: post._id
            });
        }
        // ---------------------------

        res.json({ likesCount: post.likes.length, isLiked: !isLiked });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

// 7. EDIT POST
exports.updatePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        // --- STEP 1: FIX THE 401 UNAUTHORIZED ---
        // Ensuring we compare string to string
        const authorId = post.author._id ? post.author._id.toString() : post.author.toString();
        const currentUserId = req.user._id.toString();

        if (authorId !== currentUserId) {
            return res.status(401).json({ message: "Unauthorized: You don't own this post." });
        }

        // --- STEP 2: FIX THE TAGS ---
        if (req.body['tags[]']) {
            post.tags = Array.isArray(req.body['tags[]']) ? req.body['tags[]'] : [req.body['tags[]']];
        } else if (req.body.tags) {
            // Added a fallback in case your edit modal sends 'tags' instead of 'tags[]'
            post.tags = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];
        }

        // --- STEP 3: UPDATE OTHER FIELDS ---
        post.title = req.body.title || post.title;
        post.content = req.body.content || post.content;
        post.category = req.body.category || post.category;

        if (req.file) {
            post.image = req.file.path; // Cloudinary upload
        }

        await post.save();

        // --- STEP 4: RE-POPULATE ---
        // This ensures the frontend doesn't show "Welcome back, undefined" 
        // after the post updates in the feed.
        const updatedPost = await Post.findById(post._id).populate('author', 'name avatar bio');

        res.json({ message: "Post updated! ✨", post: updatedPost });
        
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

// 8. DELETE POST
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // FIX: Extract the ID from the populated object or use it directly if it's a string
        const authorId = post.author._id ? post.author._id.toString() : post.author.toString();
        const currentUserId = req.user._id.toString();

        if (authorId !== currentUserId) {
            return res.status(401).json({ message: "Unauthorized: You can only delete your own tutorials." });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: "Post deleted. 🌿" });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
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

// --- COMMENT & REPLY ACTIONS ---
// 10. ADD MAIN COMMENT
exports.addComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        post.comments.push({ 
            user: req.user._id, 
            text: req.body.text,
            replies: [],
            likes: []
        });
        await post.save();

        // --- BULLETPROOF FIX START ---
        // We extract the ID string explicitly to ensure the comparison works
        const postAuthorId = post.author._id ? post.author._id.toString() : post.author.toString();
        const currentUserId = req.user._id.toString();

        // ONLY create notification if the IDs do NOT match
        if (postAuthorId !== currentUserId) {
            await Notification.create({
                recipient: post.author, // The person receiving the notif
                sender: req.user._id,   // The person who commented
                type: 'comment',
                post: post._id
            });
        }
        // --- BULLETPROOF FIX END ---

        const updated = await Post.findById(req.params.id).populate('comments.user', 'name avatar');
        res.status(201).json(updated.comments);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

// 11. ADD REPLY (Recursive Friendly)
exports.addReply = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const parent = findCommentDeep(post.comments, req.params.commentId);
        
        if (!parent) return res.status(404).json({ message: "Target not found" });

        parent.replies.push({
            user: req.user._id,
            text: req.body.text,
            likes: [],
            replies: [] 
        });

        await post.save();

        // Notification Logic
        if (parent.user.toString() !== req.user._id.toString()) {
            await Notification.create({
                recipient: parent.user,
                sender: req.user._id,
                type: 'comment',
                post: post._id
            });
        }

        // --- THE CRITICAL STEP ---
        // We fetch the post again using findById. 
        // This triggers the 'findOne' middleware in your Post Schema, 
        // which automatically populates the names for ALL levels of replies.
        const updatedPost = await Post.findById(req.params.id);

        res.status(201).json(updatedPost);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};


// 12. UPDATE/EDIT COMMENT (Matches route: router.put('/:id/comment/:commentId'))[cite: 3]
exports.editComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const comment = findCommentDeep(post.comments, req.params.commentId);
        
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        // --- THE FIX IS RIGHT HERE ---
        // Access the ._id property inside the populated user object
        const authorId = comment.user._id ? comment.user._id.toString() : comment.user.toString();
        const currentUserId = req.user._id.toString();

        if (authorId !== currentUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // ------------------------------

        comment.text = req.body.text;
        await post.save();
        res.json(post);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};

// 13. DELETE COMMENT (Recursive Fix)
exports.deleteComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        // Pass the user ID as a string to the helper
        const currentUserId = req.user._id.toString();
        const result = deleteRecursive(post.comments, req.params.commentId, currentUserId);

        if (result === "unauthorized") return res.status(401).json({ message: "Not your comment!" });
        if (!result) return res.status(404).json({ message: "Comment not found" });

        // Tell Mongoose to save changes even deep in the arrays
        post.markModified('comments'); 
        await post.save();
        
        res.json({ message: "Comment removed", post });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};
// 14. LIKE COMMENT
exports.likeComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const target = findCommentDeep(post.comments, req.params.commentId);
        
        if (!target) return res.status(404).json({ message: "Comment not found" });

        if (!target.likes) target.likes = [];
        
        const index = target.likes.indexOf(req.user._id);
        const isLiking = index === -1; // True if they are adding a like, false if unliking

        if (isLiking) {
            target.likes.push(req.user._id);
        } else {
            target.likes.splice(index, 1);
        }

        await post.save();

        // --- THE FIX: ONLY NOTIFY IF IT'S SOMEONE ELSE'S COMMENT ---
        // 1. Get the IDs as strings to be 100% sure the comparison works
        const commentAuthorId = target.user._id ? target.user._id.toString() : target.user.toString();
        const currentUserId = req.user._id.toString();

        // 2. Only create a notification if I'm liking someone ELSE'S comment
        if (isLiking && commentAuthorId !== currentUserId) {
            await Notification.create({
                recipient: target.user,
                sender: req.user._id,
                type: 'like', // or 'comment-like' depending on your system
                post: post._id
            });
        }

        res.status(200).json(post);
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
};