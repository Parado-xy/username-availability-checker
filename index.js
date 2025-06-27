// Entry Point of the Program. 

import dotenv from "dotenv";
import express from "express";
import connectDB from "./dbConnection.js";
import router from "./router.js";
import { fillBloom } from "./populateData.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
await connectDB();

// The express application.
const server = express();

// Body Parser Middleware.
server.use(express.json());


// Use the router; 
server.use(router); 

// Port.
const PORT = process.env.PORT || 3569;

server.listen(PORT, async () => {
  console.log(`Listening On: http://localhost:${PORT}`);

  // Fill the bloom filter;
  await fillBloom(); 
});
