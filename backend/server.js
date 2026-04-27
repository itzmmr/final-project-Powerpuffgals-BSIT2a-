require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns'); 
const path = require('path'); // Moved to the top for clean organization
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

// 1. Connect to Database
connectDB();

// 2. Global Middleware
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 3. Logging Middleware
app.use((req, res, next) => {
    console.log(`📡 ${req.method} request to: ${req.originalUrl}`);
    next();
});

// Serve uploaded files (avatars, post images) publicly
app.use('/uploads', express.static('uploads'));

// --- FRONTEND STATIC SERVING ---
// This tells Express to look into the frontend folder for CSS, JS, and Images
app.use(express.static(path.join(__dirname, '../frontend')));

// 4. Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/github', require('./routes/githubRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Updated Root Route: This now sends your actual index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 5. 404 Handler
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

// 6. Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is officially live on port ${PORT}`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
});