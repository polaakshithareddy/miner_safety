
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Hazard from '../models/Hazard.js';
import User from '../models/User.js';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const SAMPLE_HAZARDS = [
    {
        title: "Loose Electrical Wiring",
        description: "Exposed wires found near the junction box in Tunnel B. Potential shock hazard.",
        locationDescription: "Tunnel B, Junction Box 4",
        severity: "high",
        category: "electrical",
        imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
        status: "pending"
    },
    {
        title: "Slippery Walkway",
        description: "Oil spill detected on the main walkway near the cafeteria entrance.",
        locationDescription: "Cafeteria Entrance",
        severity: "medium",
        category: "environmental",
        imageUrl: "https://images.unsplash.com/photo-1518709414768-a88986a45e5d?auto=format&fit=crop&w=400&q=80",
        status: "in_review"
    },
    {
        title: "Obstruction in Emergency Exit",
        description: "Pallets stacked in front of Emergency Exit 3 blocking the path.",
        locationDescription: "Warehouse Emergency Exit 3",
        severity: "critical",
        category: "physical",
        imageUrl: "https://images.unsplash.com/photo-1581094794329-cd132c3a587c?auto=format&fit=crop&w=400&q=80",
        status: "pending"
    },
    {
        title: "Noisy Machinery",
        description: "Compressor #2 is making unusually loud grinding noises. Hearing protection required.",
        locationDescription: "Compressor Room",
        severity: "medium",
        category: "mechanical",
        imageUrl: "https://images.unsplash.com/photo-1599933345860-ae9e80233486?auto=format&fit=crop&w=400&q=80",
        status: "resolved"
    },
    {
        title: "Damaged Guardrail",
        description: "Guardrail on the upper platform is bent and unstable.",
        locationDescription: "Processing Plant, Upper Platform",
        severity: "high",
        category: "physical",
        imageUrl: "https://images.unsplash.com/photo-1574352067721-a32191d5d474?auto=format&fit=crop&w=400&q=80",
        status: "pending"
    },
    {
        title: "Chemical Fumes",
        description: "Strong smell of cleaning chemicals in the unventilated storage room.",
        locationDescription: "Janitorial Storage",
        severity: "high",
        category: "chemical",
        imageUrl: "https://images.unsplash.com/photo-1535732759880-bbd5c7265e3f?auto=format&fit=crop&w=400&q=80",
        status: "in_review"
    },
    {
        title: "Flickering Lights",
        description: "Lights in the main corridor are flickering constantly, causing visibility issues.",
        locationDescription: "Main Office Corridor",
        severity: "low",
        category: "electrical",
        imageUrl: null,
        status: "resolved"
    },
    {
        title: "Unsecured Ladder",
        description: "Ladder left leaning against the wall without being secured or attended.",
        locationDescription: "Maintenance Shop",
        severity: "medium",
        category: "physical",
        imageUrl: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80",
        status: "pending"
    }
];

const seedHazards = async () => {
    try {
        const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/mine-safety-app';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find users to assign as reporters
        const users = await User.find();
        if (users.length === 0) {
            console.log('No users found. Run createTestUsers.js first.');
            process.exit(1);
        }

        console.log(`Found ${users.length} users.`);

        await Hazard.deleteMany({});
        console.log('Cleared existing hazards.');

        const hazardsToInsert = SAMPLE_HAZARDS.map(h => {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            return {
                title: h.title,
                description: h.description,
                location: {
                    type: 'Point',
                    coordinates: [0, 0], // Default dummy coords
                    description: h.locationDescription
                },
                severity: h.severity,
                category: h.category,
                imageUrl: h.imageUrl,
                reportedBy: randomUser._id,
                status: h.status,
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000))
            };
        });

        await Hazard.insertMany(hazardsToInsert);
        console.log(`✅ Seeded ${hazardsToInsert.length} hazards.`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding hazards:', error);
        process.exit(1);
    }
};

seedHazards();
