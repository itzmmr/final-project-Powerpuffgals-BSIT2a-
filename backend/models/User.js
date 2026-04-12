const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dob: { type: Date, required: true },
    role: { type: String, default: 'student' },
    bio: { type: String, default: "" },
    avatar: { type: String, default: null },
    
    // --- INTERESTS DROPDOWN ---
    interests: { 
        type: [String], 
        enum: ['web development', 'ui/ux design', 'database management', 'mobile dev', 'cybersecurity', 'systems ecology', 'data science'],
        default: [] 
    },

    // --- ERD FIELDS ---
    githubUsername: { type: String, default: "" },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer not to say'], default: 'other' },

    // --- SETTINGS DROPDOWNS ---
    settings: {
        theme: { type: String, enum: ['light', 'dark'], default: 'light' },
        fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
        language: { 
            type: String, 
            enum: ['english', 'tagalog', 'bicolano', 'spanish'], 
            default: 'english' 
        },
        timezone: { type: String, default: 'UTC+8' }
    },
    
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

// --- PASSWORD HASHING (Fixed) ---
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);