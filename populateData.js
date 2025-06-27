import dotenv from "dotenv";
import connectDB from "./dbConnection.js";
import User from "./User.js";
import filter from "./bloom.js";

// Load environment variables
dotenv.config();

// Sample username generators
const adjectives = [
  "cool", "awesome", "super", "mega", "ultra", "swift", "bright", "smart",
  "quick", "fast", "smooth", "sharp", "bold", "brave", "calm", "wise",
  "happy", "lucky", "magic", "royal", "golden", "silver", "cosmic", "cyber"
];

const nouns = [
  "tiger", "eagle", "wolf", "lion", "bear", "hawk", "shark", "dragon",
  "phoenix", "ninja", "warrior", "knight", "wizard", "mage", "hunter",
  "player", "gamer", "coder", "hacker", "master", "legend", "hero", "star"
];

const suffixes = [
  "123", "456", "789", "2024", "pro", "x", "xx", "2k", "elite", "prime",
  "max", "plus", "ultra", "mega", "super", "alpha", "beta", "gamma", "omega"
];

// Generate random usernames
function generateUsername() {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  // Mix different patterns
  const patterns = [
    `${adjective}${noun}`,
    `${adjective}${noun}${suffix}`,
    `${noun}${suffix}`,
    `${adjective}_${noun}`,
    `${noun}_${suffix}`,
    `${adjective}${noun}${Math.floor(Math.random() * 9999)}`
  ];
  
  return patterns[Math.floor(Math.random() * patterns.length)];
}

// Generate a set of unique usernames
function generateUniqueUsernames(count) {
  const usernames = new Set();
  
  while (usernames.size < count) {
    usernames.add(generateUsername());
  }
  
  return Array.from(usernames);
}

// Fill Bloom filter from existing database data
export async function fillBloom() {
  try {
    console.log("🌸 Starting Bloom filter initialization...");
    
    // Get all usernames from database
    console.log("📊 Fetching usernames from database...");
    const users = await User.find({}, { username: 1, _id: 0 });
    
    if (users.length === 0) {
      console.log("⚠️  No usernames found in database. Bloom filter will be empty.");
      return;
    }
    
    console.log(`📈 Found ${users.length} usernames in database`);
    
    // Add usernames to Bloom filter
    let addedCount = 0;
    for (const user of users) {
      filter.add(user.username);
      addedCount++;
      
      // Show progress every 1000 entries
      if (addedCount % 1000 === 0) {
        const progress = ((addedCount / users.length) * 100).toFixed(1);
        console.log(`  🌸 Loading progress: ${addedCount}/${users.length} (${progress}%)`);
      }
    }
    
    console.log(`✅ Bloom filter loaded with ${addedCount} usernames`);
    
    // Quick verification with a few random usernames
    console.log("🔍 Quick verification:");
    const sampleSize = Math.min(3, users.length);
    const randomUsers = users.sort(() => 0.5 - Math.random()).slice(0, sampleSize);
    
    for (const user of randomUsers) {
      const inFilter = filter.has(user.username);
      console.log(`  "${user.username}": ${inFilter ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error("❌ Error filling Bloom filter:", error.message);
    throw error;
  }
}

// Populate database with sample data (for development/testing)
export async function populateDatabase(count = 10000) {
  try {
    console.log(`🚀 Starting to populate ${count} usernames in database...`);
    
    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await User.deleteMany({});
    
    // Generate unique usernames
    console.log("🎲 Generating unique usernames...");
    const usernames = generateUniqueUsernames(count);
    console.log(`✅ Generated ${usernames.length} unique usernames`);
    
    // Prepare user documents for MongoDB
    const userDocs = usernames.map(username => ({ username }));
    
    // Insert into MongoDB in batches
    console.log("💾 Inserting usernames into MongoDB...");
    const batchSize = 1000;
    let insertedCount = 0;
    
    for (let i = 0; i < userDocs.length; i += batchSize) {
      const batch = userDocs.slice(i, i + batchSize);
      await User.insertMany(batch);
      insertedCount += batch.length;
      
      // Show progress
      const progress = ((insertedCount / usernames.length) * 100).toFixed(1);
      console.log(`  📊 Progress: ${insertedCount}/${usernames.length} (${progress}%)`);
    }
    
    console.log("✅ Database population completed!");
    console.log(`📊 Total usernames in database: ${await User.countDocuments()}`);
    
    return usernames;
    
  } catch (error) {
    console.error("❌ Error populating database:", error.message);
    throw error;
  }
}

// Combined function to populate database AND fill bloom filter
export async function initializeData(count = 10000) {
  try {
    console.log("🎯 Initializing complete data setup...");
    
    // First populate the database
    await populateDatabase(count);
    
    // Then fill the bloom filter from database
    await fillBloom();
    
    // Test false positives
    console.log("\n🎯 Testing potential false positives:");
    const testNonExistent = ["nonexistent123", "fakeuserxyz", "notreal456"];
    
    for (const username of testNonExistent) {
      const inFilter = filter.has(username);
      const inDatabase = await User.findOne({ username });
      
      console.log(`  "${username}": Filter=${inFilter}, Database=${!!inDatabase}`);
      
      if (inFilter && !inDatabase) {
        console.log(`  🎯 False positive detected for "${username}"`);
      }
    }
    
    console.log("\n🎉 Complete data initialization finished!");
    
  } catch (error) {
    console.error("❌ Error in data initialization:", error.message);
    throw error;
  }
}

// For standalone script execution (optional)
if (import.meta.url === `file://${process.argv[1]}`) {
  async function main() {
    try {
      await connectDB();
      
      const count = process.argv[2] ? parseInt(process.argv[2]) : 10000;
      
      if (isNaN(count) || count <= 0) {
        console.error("❌ Please provide a valid positive number for username count");
        process.exit(1);
      }
      
      await initializeData(count);
      
    } catch (error) {
      console.error("❌ Script failed:", error.message);
      process.exit(1);
    } finally {
      process.exit(0);
    }
  }
  
  main();
}