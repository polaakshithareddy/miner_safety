import mongoose from 'mongoose';
import User from '../models/User.js';
import DailyComplianceSnapshot from '../models/DailyComplianceSnapshot.js';
import dotenv from 'dotenv';

dotenv.config();

const RISK_LEVELS = ['low', 'medium', 'high'];

const seedComplianceSnapshots = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mine-safety');
    console.log('Connected to MongoDB');

    // Get all employees
    const employees = await User.find({ role: { $in: ['employee', 'worker'] } });
    console.log(`Found ${employees.length} employees`);

    if (employees.length === 0) {
      console.log('No employees found. Please seed users first.');
      process.exit(1);
    }

    // Delete existing snapshots from last 7 days to avoid duplicates
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const formattedDate = sevenDaysAgo.toISOString().split('T')[0];
    await DailyComplianceSnapshot.deleteMany({
      date: { $gte: formattedDate }
    });
    console.log('Cleared existing snapshots from last 7 days');

    const snapshots = [];
    const today = new Date();

    // Create snapshots for last 7 days
    for (let dayOffset = 7; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0];

      // Create a snapshot for each employee
      for (const employee of employees) {
        const randomCompliance = Math.floor(Math.random() * 100);
        const randomRiskLevel = RISK_LEVELS[Math.floor(Math.random() * RISK_LEVELS.length)];

        snapshots.push({
          user: employee._id,
          date: dateStr,
          complianceScore: randomCompliance,
          riskLevel: randomRiskLevel,
          metrics: {
            checklistCompletionRate: Math.floor(Math.random() * 100),
            checklistsCompleted: Math.floor(Math.random() * 5),
            engagementMinutes: Math.floor(Math.random() * 60),
            hazardsReported: Math.floor(Math.random() * 3),
            quizScore: Math.floor(Math.random() * 100),
          },
          streakCount: Math.floor(Math.random() * 10),
        });
      }
    }

    await DailyComplianceSnapshot.insertMany(snapshots);
    console.log(`✅ Seeded ${snapshots.length} compliance snapshots`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding compliance snapshots:', error);
    process.exit(1);
  }
};

seedComplianceSnapshots();
