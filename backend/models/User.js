const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dob: { type: Date, required: true },
    age: { type: Number },
    // REMOVED ENUM: Now allows any custom role typed by the user
    role: { type: String, default: 'it student' },
    githubUsername: { type: String, default: "" }, 
    bio: { type: String, default: "" },
    avatar: { type: String, default: null },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // REMOVED ENUM: Now allows any custom interests typed in the "Other" field
    interests: { 
        type: [String], 
        default: [] 
    },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
    settings: {
        theme: { type: String, enum: ['light', 'dark', 'forest', 'stone'], default: 'light' },
        fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
        language: { type: String, default: 'english' },
        timezone: { type: String, default: 'UTC+8' }
    }
}, { timestamps: true });

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