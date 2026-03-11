
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Post from '../models/Post.js';
import User from '../models/User.js';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const SAMPLE_POSTS = [
    {
        description: "Checking the conveyor belt alignment. Always ensure lockout requires are met before maintenance! 🔧👷‍♂️",
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1599933345860-ae9e80233486?auto=format&fit=crop&w=800&q=80',
        category: 'General',
        likesCount: 12
    },
    {
        description: "Great start to the morning shift. Safety meeting complete and everyone is geared up. Let's have a zero-incident day! ☀️",
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1581094794329-cd132c3a587c?auto=format&fit=crop&w=800&q=80',
        category: 'General',
        likesCount: 24
    },
    {
        description: "Observed a potential loose rock hazard in Section 4. Barricaded the area and reported it. Stay clear until cleared! ⚠️🪨",
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1574352067721-a32191d5d474?auto=format&fit=crop&w=800&q=80',
        category: 'Hazard',
        likesCount: 8
    },
    {
        description: "New ventilation fans are running smoothly. Air quality is looking much better in the lower drifts. 💨",
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
        category: 'Safety Update',
        likesCount: 15
    },
    {
        description: "Remember to drink water! It's hot down here today. Hydration is key to staying alert. 💧",
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1548545366-4186522c074f?auto=format&fit=crop&w=800&q=80',
        category: 'General',
        likesCount: 30
    },
    {
        description: "Reviewing the updated emergency response plan. Make sure you know your muster points! 🚨",
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1563212888-251f26742510?auto=format&fit=crop&w=800&q=80',
        category: 'Safety Update',
        likesCount: 18
    },
    {
        description: "Proper heavy lifting technique demonstration. Lift with your legs, not your back! 💪",
        mediaType: 'video',
        mediaUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        category: 'General',
        likesCount: 45
    },
    {
        description: "Spotted oil leak on Loader #3. Tagged out and notified maintenance. Always inspect your equipment pre-shift! 🚜",
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1518709414768-a88986a45e5d?auto=format&fit=crop&w=800&q=80',
        category: 'Incident',
        likesCount: 10
    },
    {
        description: "PPE spot check! good to see everyone wearing their safety glasses and high-vis vests. Keep it up team. 👍",
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1535732759880-bbd5c7265e3f?auto=format&fit=crop&w=800&q=80',
        category: 'Safety Update',
        likesCount: 22
    },
    {
        description: "Training session on the new gas detectors. These units are much more sensitive. 📉",
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80',
        category: 'General',
        likesCount: 14
    }
];

const seedPosts = async () => {
    try {
        const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/mine-safety-app';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find some users to assign as authors
        const users = await User.find({ role: { $ne: 'admin' } }); // Use workers/supervisors
        if (users.length === 0) {
            console.log('No users found. Please run createTestUsers.js first.');
            process.exit(1);
        }

        console.log(`Found ${users.length} potential authors.`);

        // Delete existing posts (optional, but good for clean slate)
        await Post.deleteMany({});
        console.log('Cleared existing posts.');

        const postsToInsert = [];

        for (const postData of SAMPLE_POSTS) {
            // Pick a random author
            const randomUser = users[Math.floor(Math.random() * users.length)];

            // Generate some random likes (using other users)
            const likeCount = postData.likesCount;
            const likes = users
                .sort(() => 0.5 - Math.random()) // Shuffle
                .slice(0, Math.min(likeCount, users.length))
                .map(u => u._id);

            postsToInsert.push({
                author: randomUser._id,
                mediaUrl: postData.mediaUrl,
                mediaType: postData.mediaType,
                description: postData.description,
                category: postData.category,
                status: 'approved',
                likes: likes,
                comments: [], // Could add fake comments later
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)) // Random time in last 10 days
            });
        }

        // Sort by date desc (newest first) before inserting? MongoDB insertion order doesn't guarantee this, but usually fine.
        // Actually Feed sorts by createdAt desc.

        await Post.insertMany(postsToInsert);
        console.log(`✅ Successfully seeded ${postsToInsert.length} posts.`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding posts:', error);
        process.exit(1);
    }
};

seedPosts();
