require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns'); 
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Fix for network/DNS environments in Bicol (Preserved)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

// Connect to Database
connectDB();

// Global Middleware (Updated with limits to fix "Entity Too Large")
app.use(cors());
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging Middleware (Preserved)
app.use((req, res, next) => {
    console.log(`📡 ${req.method} request to: ${req.url}`);
    next();
});

// Routes (Preserved)
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/github', require('./routes/githubRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Root Route
app.get('/', (req, res) => {
    res.send('🚀 NexusWrites API is running smoothly...');
});

// Error Handling (Preserved)
app.use((req, res) => {
    res.status(404).json({ message: "Route not found. Check your URL!" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is officially live on port ${PORT}`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
});