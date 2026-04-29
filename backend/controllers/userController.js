const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification'); 
const jwt = require('jsonwebtoken');

// Helper to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// 1. REGISTER
exports.register = async (req, res) => {
    try {
        // INSERTED: githubUsername
        const { username, name, email, password, dob, bio, interests, role, gender, githubUsername } = req.body;
        const finalName = name || username;

        if (!finalName || !email || !password || !dob || !gender) {
            return res.status(400).json({ error: "Required fields missing (Name, Email, Password, DOB, Gender)" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "User already exists" });

        // --- AUTO-AGE CALCULATION (Untouched) ---
        const birthDate = new Date(dob);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
        }

        // --- INTERESTS SANITIZATION (Untouched) ---
        let processedInterests = [];
        if (interests) {
            const rawInterests = Array.isArray(interests) ? interests : [interests];
            processedInterests = rawInterests.map(i => i.toLowerCase().trim());
        }

        const user = await User.create({
            name: finalName,
            email,
            password, 
            dob,
            age: calculatedAge, 
            gender: gender.toLowerCase(), 
            bio: bio || "Technical Contributor",
            role: role ? role.toLowerCase() : "it student",
            interests: processedInterests,
            githubUsername: githubUsername || "", // INSERTED
            avatar: req.file ? req.file.path : (req.body.avatar || null)
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            token: generateToken(user._id),
            avatar: user.avatar,
            role: user.role,
            age: user.age,
            githubUsername: user.githubUsername // INSERTED
        });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// 2. LOGIN
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
                role: user.role,
                age: user.age,
                gender: user.gender,
                githubUsername: user.githubUsername, // INSERTED
                settings: user.settings
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. UPDATE PROFILE & SETTINGS
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // --- AGE & DOB UPDATE ---
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

        // --- CORE IDENTITY ---
        user.name = req.body.name || user.name;
        user.bio = req.body.bio || user.bio;
        
        // Handle Role (IT Student, Developer, etc.)
        if (req.body.role) user.role = req.body.role; 

        if (req.body.gender) user.gender = req.body.gender.toLowerCase();
        
        // --- GITHUB LINKING ---
        if (req.body.githubUsername !== undefined) {
            user.githubUsername = req.body.githubUsername.trim();
        }

        // --- SETTINGS ---
        if (req.body.theme) user.settings.theme = req.body.theme.toLowerCase();
        if (req.body.fontSize) user.settings.fontSize = req.body.fontSize.toLowerCase();
        if (req.body.language) user.settings.language = req.body.language.toLowerCase();
        if (req.body.timezone) user.settings.timezone = req.body.timezone;

        // --- INTERESTS (Tech Stack) ---
        if (req.body.interests) {
            // Ensure we are working with an array even if one item is sent
            let selected = Array.isArray(req.body.interests) ? req.body.interests : [req.body.interests];
            // Filter out any empty strings and normalize to lowercase
            user.interests = selected
                .filter(i => i && i.trim() !== "")
                .map(i => i.toLowerCase().trim());
        }

        // --- SECURITY & MEDIA ---
        if (req.body.password) {
            // The pre-save hook in your User model will handle the hashing
            user.password = req.body.password;
        }

        // Handle Avatar (File upload vs Base64/String)
        if (req.file) {
            user.avatar = req.file.path;
        } else if (req.body.avatar) {
            user.avatar = req.body.avatar;
        }

        // --- SAVE CHANGES ---
        const updatedUser = await user.save();
        
        // Convert to object to remove password from the response for security
        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        res.json({ 
            message: "Profile updated! ✨", 
            user: userResponse 
        });

    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// 4. SEARCH USERS
exports.searchUsers = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ message: "Search query is empty" });

        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { interests: { $in: [new RegExp(query, 'i')] } }
            ]
        }).select('name avatar bio interests role githubUsername'); // INSERTED: githubUsername
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. FOLLOW / UNFOLLOW
exports.toggleFollow = async (req, res) => {
    try {
        const targetId = req.params.id;
        const myId = req.user._id;

        if (targetId === myId.toString()) {
            return res.status(400).json({ message: "You cannot follow yourself!" });
        }

        const targetUser = await User.findById(targetId);
        const currentUser = await User.findById(myId);

        if (!targetUser) return res.status(404).json({ message: "User not found" });

        // Check if we are already following
        const isFollowing = currentUser.following.includes(targetId);

        if (isFollowing) {
            // Unfollow: Remove IDs from both arrays
            currentUser.following.pull(targetId);
            targetUser.followers.pull(myId);
        } else {
            // Follow: Add IDs to both arrays
            currentUser.following.push(targetId);
            targetUser.followers.push(myId);
            // Create a notification if you have that model set up
            if (typeof Notification !== 'undefined') {
                await Notification.create({ recipient: targetId, sender: myId, type: 'follow' });
            }
        }

        await currentUser.save();
        await targetUser.save();

        res.json({ message: isFollowing ? "Unfollowed" : "Followed", isFollowing: !isFollowing });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 6. GET PROFILE
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

/* 7. NOTIFICATION */
const followUser = async (req, res) => {
    // ... your existing code ...

    if (!alreadyFollowing) {
        await Notification.create({
            recipient: targetUserId,
            sender: req.user._id,
            type: 'follow'
        });
    }
};


// 8. GET USER STATISTICS
exports.getUserStats = async (req, res) => {
    try {
        const targetId = req.params.id; 
        const user = await User.findById(targetId);
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const postCount = await Post.countDocuments({ author: targetId });
        
        const followersArray = user.followers || [];
        const followingArray = user.following || [];

        res.json({
            name: user.name,
            role: user.role,
            bio: user.bio,
            avatar: user.avatar,
            githubUsername: user.githubUsername, // INSERTED: Critical for public view
            followers: followersArray.length,
            following: followingArray.length,
            followersList: followersArray, 
            posts: postCount
        });
    } catch (err) {
        console.error("Error in getUserStats:", err);
        res.status(500).json({ error: err.message });
    }
};

// 9. Update Password with Verification
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // req.user._id comes from your 'protect' middleware
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ message: "User not found" });

        // 1. Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: "Ang kasalukuyang password ay mali." });
        }

        // 2. Set new password (the User model pre-save hook will hash this automatically)
        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: "Password updated successfully! ✨" });
    } catch (err) {
        console.error("Password Update Error:", err);
        res.status(500).json({ error: "Server error during password update." });
    }
};