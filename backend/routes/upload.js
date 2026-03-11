import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure storage
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

function checkFileType(file, cb) {
    // Allow any image or video mime type
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        return cb(null, true);
    }

    // Fallback to extension check for safety
    const filetypes = /jpg|jpeg|png|gif|mp4|mov|avi|wmv|mkv/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
        return cb(null, true);
    } else {
        cb(new Error('Images and Videos only!'));
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit for videos
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

router.post('/', (req, res, next) => {
    console.log('Incoming upload request...');
    next();
}, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded' });
    }

    // Return relative path. Frontend should prepend BASE_URL if needed, 
    // OR backend returns full URL if it knew its host.
    // For now, return relative path.
    // Note: windows vs unix paths. Forward slash is web standard.
    const relativePath = `/uploads/${req.file.filename}`;

    res.send({
        url: relativePath,
        message: 'File uploaded successfully'
    });
});

export default router;
