import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mine-safety-app')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Define User schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    operationRole: String,
    preferredLanguage: String,
    createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);

// Create test users
async function createTestUsers() {
    try {
        // Check if users already exist
        const employeeExists = await User.findOne({ email: 'employee@test.com' });
        const supervisorExists = await User.findOne({ email: 'supervisor@test.com' });
        const workerExists = await User.findOne({ email: 'worker@test.com' });

        if (!employeeExists) {
            await User.create({
                name: 'Test Employee',
                email: 'employee@test.com',
                password: '123456',
                role: 'employee',
                operationRole: 'Miner',
                preferredLanguage: 'english'
            });
            console.log('✅ Created employee@test.com (password: 123456)');
        } else {
            console.log('⚠️  employee@test.com already exists');
        }

        if (!supervisorExists) {
            await User.create({
                name: 'Test Supervisor',
                email: 'supervisor@test.com',
                password: '123456',
                role: 'supervisor',
                operationRole: 'Miner',
                preferredLanguage: 'english'
            });
            console.log('✅ Created supervisor@test.com (password: 123456)');
        } else {
            console.log('⚠️  supervisor@test.com already exists');
        }

        if (!workerExists) {
            await User.create({
                name: 'Test Worker',
                email: 'worker@test.com',
                password: '123456',
                role: 'worker',
                operationRole: 'Miner',
                preferredLanguage: 'english'
            });
            console.log('✅ Created worker@test.com (password: 123456)');
        } else {
            console.log('⚠️  worker@test.com already exists');
        }

        console.log('\n📋 Test Accounts Summary:');
        console.log('Admin:      123@gmail.com (existing)');
        console.log('Employee:   employee@test.com / 123456');
        console.log('Supervisor: supervisor@test.com / 123456');
        console.log('Worker:     worker@test.com / 123456');

        process.exit(0);
    } catch (error) {
        console.error('Error creating users:', error);
        process.exit(1);
    }
}

createTestUsers();
