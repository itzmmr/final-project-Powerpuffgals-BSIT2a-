const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // Check for the Authorization Header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to request
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User no longer exists' });
            }

            console.log(`🛡️ Auth Middleware: ${req.user.name} is verified.`);
            return next(); // This MUST be here to reach the controller
        } catch (error) {
            console.error("❌ Auth Error:", error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        console.log("⚠️ Auth Warning: No token provided in request.");
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };