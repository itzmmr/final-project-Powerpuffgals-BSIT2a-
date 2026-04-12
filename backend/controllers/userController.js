const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification'); 
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// 1. REGISTER (Integrated with Auto-Age and Lowercase Sanitization)
exports.register = async (req, res) => {
    try {
        const { username, name, email, password, dob, bio, interests, githubUsername, gender } = req.body;
        const finalName = name || username;

        if (!finalName || !email || !password || !dob) {
            return res.status(400).json({ error: "Required fields missing (Name, Email, Password, DOB)" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        // --- AUTO-AGE CALCULATION ---
        const birthDate = new Date(dob);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
        }

        // --- INTERESTS SANITIZATION ---
        const processedInterests = interests 
            ? (Array.isArray(interests) ? interests.map(i => i.toLowerCase()) : interests.split(',').map(i => i.trim().toLowerCase())) 
            : [];

        const user = await User.create({
            name: finalName,
            email,
            password, 
            dob,
            age: calculatedAge, // Automatically calculated
            gender: gender ? gender.toLowerCase() : "",
            bio: bio || "",
            githubUsername: githubUsername || "",
            interests: processedInterests,
            avatar: req.file ? req.file.path : null 
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            token: generateToken(user._id),
            avatar: user.avatar,
            githubUsername: user.githubUsername,
            settings: user.settings
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. LOGIN (Preserved)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                token: generateToken(user._id),
                avatar: user.avatar,
                bio: user.bio,
                interests: user.interests,
                githubUsername: user.githubUsername,
                age: user.age,
                gender: user.gender,
                settings: user.settings
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. UPDATE PROFILE & SETTINGS (SMART INTEGRATION)
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // --- UPDATE DOB & AUTO-AGE ---
        if (req.body.dob) {
            user.dob = req.body.dob;
            const birthDate = new Date(req.body.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
                age--;
            }
            user.age = age;
        }

        // --- IDENTITY (Sanitized for Mixed Case) ---
        user.name = req.body.name || user.name;
        user.bio = req.body.bio || user.bio;
        user.githubUsername = req.body.githubUsername || user.githubUsername;
        if (req.body.gender) user.gender = req.body.gender.toLowerCase();
        
        // --- DISPLAY SETTINGS (Sanitized for Mixed Case) ---
        if (req.body.theme) user.settings.theme = req.body.theme.toLowerCase();
        if (req.body.fontSize) user.settings.fontSize = req.body.fontSize.toLowerCase();
        if (req.body.language) user.settings.language = req.body.language.toLowerCase();
        if (req.body.timezone) user.settings.timezone = req.body.timezone;

        // --- INTERESTS DROPDOWN SANITIZATION ---
        if (req.body.interests) {
            const selected = Array.isArray(req.body.interests) ? req.body.interests : [req.body.interests];
            user.interests = selected.map(i => i.toLowerCase());
        }

        if (req.body.password) user.password = req.body.password;
        if (req.file) user.avatar = req.file.path;

        const updatedUser = await user.save();
        res.json({ message: "Settings and Profile updated! ✨🌿", user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. SEARCH USERS (Preserved)
exports.searchUsers = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ message: "Search query is empty" });

        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { interests: { $regex: query, $options: 'i' } }
            ]
        }).select('name avatar bio interests githubUsername settings');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. FOLLOW / UNFOLLOW (Preserved)
exports.toggleFollow = async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot follow yourself!" });
        }
        const targetUser = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!targetUser || !currentUser) return res.status(404).json({ message: "User not found" });

        const isFollowing = currentUser.following.some(id => id.toString() === targetUser._id.toString());

        if (isFollowing) {
            currentUser.following = currentUser.following.filter(id => id.toString() !== targetUser._id.toString());
            targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUser._id.toString());
        } else {
            currentUser.following.push(targetUser._id);
            targetUser.followers.push(currentUser._id);
            await Notification.create({
                recipient: targetUser._id,
                sender: currentUser._id,
                type: 'follow'
            });
        }
        await currentUser.save();
        await targetUser.save();
        res.json({ message: isFollowing ? "Unfollowed" : "Followed", isFollowing: !isFollowing });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 6. GET PROFILE (Preserved)
exports.getUserProfile = async (req, res) => {
    try {
        const [user, posts] = await Promise.all([
            User.findById(req.params.id).select('-password'),
            Post.find({ author: req.params.id }).sort({ createdAt: -1 })
        ]);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ user, posts, postCount: posts.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 7. GET FRIENDS (Preserved)
exports.getFriends = async (req, res) => {
    try {
        const friends = await User.find({
            _id: { $in: req.user.following },
            following: req.user._id
        }).select('name avatar bio interests githubUsername settings');
        res.json(friends);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 8. GET USER STATISTICS (Preserved)
exports.getUserStats = async (req, res) => {
    try {
        const postCount = await Post.countDocuments({ author: req.user._id });
        const unreadNotifications = await Notification.countDocuments({ 
            recipient: req.user._id, 
            isRead: false 
        });
        res.json({
            followers: req.user.followers.length,
            following: req.user.following.length,
            posts: postCount,
            unreadNotifications
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};