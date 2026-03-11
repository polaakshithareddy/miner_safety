import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
    dest: tempDir,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Initialize OpenAI client
const apiKey = process.env.OPENAI_API_KEY;
console.log('OpenAI API Key loaded:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT FOUND');

const openai = new OpenAI({
    apiKey: apiKey || 'your-api-key-here'
});

/**
 * GET /api/transcribe/test
 * Test endpoint to verify route is working
 */
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Transcription endpoint is working',
        hasApiKey: !!process.env.OPENAI_API_KEY
    });
});

/**
 * POST /api/transcribe
 * Transcribe audio file to text using OpenAI Whisper
 */
router.post('/', upload.single('audio'), async (req, res) => {
    console.log('=== Transcription Request Received ===');
    console.log('Headers:', req.headers);
    console.log('File:', req.file);
    console.log('Body:', req.body);

    try {
        if (!req.file) {
            console.error('No audio file in request');
            return res.status(400).json({
                success: false,
                error: 'No audio file provided'
            });
        }

        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-api-key-here') {
            console.error('OpenAI API key not configured');
            return res.status(500).json({
                success: false,
                error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to .env file'
            });
        }

        console.log('Transcribing audio file:', req.file.filename);
        console.log('File path:', req.file.path);
        console.log('File size:', req.file.size, 'bytes');

        // Verify file exists
        if (!fs.existsSync(req.file.path)) {
            throw new Error('Uploaded file not found');
        }

        // Create a read stream for the audio file
        const audioFile = fs.createReadStream(req.file.path);

        // Call OpenAI Whisper API
        console.log('Calling OpenAI Whisper API...');
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            language: 'en', // Can be made dynamic based on user preference
            response_format: 'text'
        });

        // Clean up the temporary file
        fs.unlinkSync(req.file.path);

        console.log('Transcription successful:', transcription);

        res.json({
            success: true,
            text: transcription
        });

    } catch (error) {
        console.error('=== Transcription Error ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        // Clean up temp file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('Error cleaning up temp file:', cleanupError);
            }
        }

        res.status(500).json({
            success: false,
            error: 'Failed to transcribe audio',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

export default router;
