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
    console.log('🔄 Connecting to MongoDB...');
    
    // Try to reconnect if not already connected
    if (mongoose.connection.readyState !== 1) {
      const db = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout de 5s pour éviter les blocages
      });
      
      isConnected = true;
      console.log('✅ MongoDB connected successfully');
      return db;
    } else {
      console.log('📊 MongoDB already connected');
      isConnected = true;
      return mongoose;
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    
    // Try to reconnect with a different backoff approach
    if (error.name === 'MongooseServerSelectionError') {
      console.log('⚠️ Mongoose server selection error, trying again in 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      return dbConnect(); // Try again after waiting
    }
    
    throw error;
  }
};

// Expose function to check connection status
dbConnect.isConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Handle connection events for better logging
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
  isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('🟠 Mongoose disconnected from MongoDB');
  isConnected = false;
});

// Handle process termination gracefully
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed due to app termination');
  process.exit(0);
});

module.exports = dbConnect;