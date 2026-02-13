// const mongoose = require('mongoose');
// const dotenv = require('dotenv');

// // Load environment variables from .env file
// dotenv.config();

// // MongoDB connection URI (from .env)
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_surf_db';

// // Function to connect to MongoDB
// const connectDB = async () => {
//   try {
//     await mongoose.connect(MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     console.log('✅ MongoDB connection successful');
//   } catch (error) {
//     console.error('❌ MongoDB connection failed:', error.message);
//     process.exit(1); // Exit process with failure
//   }
// };

// // Export the connection function
// module.exports = connectDB;