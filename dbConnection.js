import mongoose from "mongoose";

// MongoDB connection configuration
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/username-checker";

// Connection options for better performance and reliability
const connectionOptions = {
  // Connection timeout (10 seconds)
  serverSelectionTimeoutMS: 10000,
  // Socket timeout (45 seconds)
  socketTimeoutMS: 45000,
  // Connection pool size
  maxPoolSize: 10,
  // Minimum connection pool size
  minPoolSize: 5,
  // Close connections after 30 seconds of inactivity
  maxIdleTimeMS: 30000,
  // Buffer commands when disconnected
  bufferCommands: false,
  // Use unified topology
  useUnifiedTopology: true,
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, connectionOptions);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on("connected", () => {
      console.log("📡 Mongoose connected to MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("📴 Mongoose disconnected from MongoDB");
    });

    // Handle process termination
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        console.log("🔌 MongoDB connection closed through app termination");
        process.exit(0);
      } catch (err) {
        console.error("Error closing MongoDB connection:", err);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;
