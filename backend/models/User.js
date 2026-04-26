const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    dob: { type: Date, required: true },
    age: { type: Number },
    role: { type: String, default: 'it student' },
    // INSERTED: Field to store the GitHub handle for the API integration
    githubUsername: { type: String, default: "" }, 
    bio: { type: String, default: "" },
    avatar: { type: String, default: null },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    interests: { 
        type: [String], 
        enum: [
            'web systems', 'ai & ml', 'cybersecurity', 'cloud computing', 
            'data analytics', 'devops', 'iot systems', 'blockchain',
            'web development', 'ui/ux design', 'database management', 
            'mobile dev', 'technical writing'
        ],
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

// FIXED ASYNC PRE-SAVE
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