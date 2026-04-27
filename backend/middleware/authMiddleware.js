const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Extract the token
            token = req.headers.authorization.split(' ')[1];
            
            // --- AUTH DEBUG ---
            console.log("--- AUTH DEBUG ---");
            console.log("Token received:", token);

            // 2. CRITICAL CHECK: Stop if token is missing or the string "undefined"
            if (!token || token === 'undefined') {
                console.error("DEBUG: Token is missing or string 'undefined'");
                return res.status(401).json({ message: 'Not authorized, token malformed' });
            }

            // 3. Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // 4. Attach user to request (excluding password)
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'User no longer exists' });
            }

            return next();
        } catch (error) {
            console.error("JWT Error Type:", error.name); 
            console.error("JWT Error Message:", error.message);
            return res.status(401).json({ message: 'Not authorized' });
        }
    }

    // 5. Final check if no header was present at all
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };