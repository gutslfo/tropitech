// server/utils/dbConnect.js
const mongoose = require('mongoose');

// Track connection state
let isConnected = false;

/**
 * Connect to MongoDB database using a singleton pattern
 * @returns {Promise<typeof mongoose>} Mongoose connection
 */
const dbConnect = async () => {
  if (isConnected) {
    console.log('📊 Using existing MongoDB connection');
    return mongoose;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in .env file');
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      // Remove deprecated options
      // useNewUrlParser and useUnifiedTopology are no longer needed in newer mongoose versions
      serverSelectionTimeoutMS: 5000, // Timeout de 5s pour éviter les blocages
    });
    
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

module.exports = dbConnect;