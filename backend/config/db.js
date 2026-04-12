const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // In Mongoose 6+, options like useNewUrlParser are default
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ Database Connection Failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;