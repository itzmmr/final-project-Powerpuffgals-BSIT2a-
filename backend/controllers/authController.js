const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER
exports.register = async (req, res) => {
    try {
        // Destructure all incoming data including profile fields
        const { name, email, password, dob, gender, bio, role, githubUsername, interests, avatar } = req.body;

        // 1. Calculate Age
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        
        // Adjust age if birthday hasn't happened yet this year
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        // 2. Age Gate Check (Updated to 18)
        if (age < 18) {
            return res.status(400).json({ 
                message: "Access Denied. You must be at least 18 years old to join NEXUSWrites." 
            });
        }

        // 3. Prevent duplicate email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered." });
        }

        // 4. Create User (Explicitly include the 'age' we calculated)
        const user = new User({ 
            name, 
            email, 
            password, 
            dob, 
            age, // This ensures the database stores the calculated age instead of 0
            gender,
            bio,
            role,
            githubUsername,
            interests,
            avatar
        });

        await user.save();

        // 5. Success Response
        res.status(201).json({
            message: "User registered successfully!",
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email,
                age: user.age // Send it back to verify
            }
        });

    } catch (err) {
        console.error("Registration Error:", err);
        res.status(500).json({ error: err.message });
    }
};
// LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'nexuswrites_secret_key',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};