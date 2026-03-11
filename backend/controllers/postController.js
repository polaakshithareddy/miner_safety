import Post from '../models/Post.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI
// Note: This requires OPENAI_API_KEY in .env
let openai;
try {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-to-prevent-crash'
    });
} catch (e) {
    console.warn("OpenAI Init Failed (Expected if key missing):", e.message);
}

// AI Content Check (Real Implementation)
const checkContentRelevance = async (description, category, mediaUrl) => {
    try {
        // If no API key is set, fallback to mock (allow everything for demo continuity unless strictly testing AI)
        if (!process.env.OPENAI_API_KEY || !openai) {
            console.warn("OPENAI_API_KEY missing or init failed. Skipping AI check (Auto-Approx).");
            return { valid: true };
        }

        let imageAnalysis = "";

        // If there is an image, analyze it using GPT-4 Vision
        if (mediaUrl && (mediaUrl.endsWith('.jpg') || mediaUrl.endsWith('.png') || mediaUrl.endsWith('.jpeg'))) {
            // 1. Read file from disk (since local upload)
            // mediaUrl is like '/uploads/file.jpg'
            // Backend root is logical root, but we need absolute path.
            // We are in 'controllers', uploads is in '../uploads' relative to here? 
            // actually server.js serves '/uploads', mapped to 'backend/uploads'.
            // __dirname is backend/controllers.
            const filePath = path.join(__dirname, '..', mediaUrl);

            if (fs.existsSync(filePath)) {
                const imageBuffer = fs.readFileSync(filePath);
                const base64Image = imageBuffer.toString('base64');
                const dataUrl = `data:image/jpeg;base64,${base64Image}`; // generic mime

                const visionResponse = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Is this image related to mining operations, construction, industrial safety, or heavy machinery? Answer YES or NO and explain briefy." },
                                { type: "image_url", image_url: { url: dataUrl } }
                            ]
                        }
                    ],
                    max_tokens: 300
                });
                imageAnalysis = visionResponse.choices[0].message.content;
            }
        }

        // Full analysis with text + image context
        const prompt = `
        Context: An app for Mining Safety.
        User Post:
        Category: ${category}
        Description: ${description}
        Image Analysis: ${imageAnalysis}

        Task: Determine if this content is relevant to mining safety/operations.
        Relevant content includes: Hazards, Machinery, Safety updates, Personal Protective Equipment (PPE), Shift updates, Site conditions.
        Irrelevant content: Selfies without PPE, Food, unrelated landscape, random memes.
        
        Return JSON: { "valid": boolean, "reason": "string" }
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result;

    } catch (error) {
        console.error("AI Check Error:", error);
        // Fail open or closed? For demo, fail open (allow) but warn.
        return { valid: true, reason: "AI check failed, auto-approved." };
    }
};

export const createPost = async (req, res) => {
    try {
        const { mediaUrl, mediaType, description, category } = req.body;

        // 1. AI Content Check
        const aiResult = await checkContentRelevance(description, category, mediaUrl);

        const status = aiResult.valid ? 'approved' : 'rejected';
        const moderationReason = aiResult.reason;

        const newPost = new Post({
            author: req.user._id,
            mediaUrl,
            mediaType,
            description,
            category,
            status,
            moderationReason
        });

        const savedPost = await newPost.save();

        // Populate author info
        await savedPost.populate('author', 'name role operationRole');

        // Notify user if rejected
        if (status === 'rejected') {
            const notification = await Notification.create({
                recipient: req.user._id,
                type: 'post_rejected',
                post: savedPost._id,
                message: `Your post was rejected: ${moderationReason}`
            });
            if (req.io) req.io.to(req.user._id.toString()).emit('notification', notification);
        } else {
            // Notify followers? Or just approve.
            // Maybe notify supervisors of new hazard?
            if (category === 'Hazard' || category === 'Incident') {
                // Find all supervisors (Simulated broadcast to simple room)
                // req.io.to('supervisor').emit(...)
                // For now just basic approval notification to self is redundant.
            }
        }

        res.status(201).json(savedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getFeed = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Fetch ALL approved posts (Global Feed)
        // Optionally filter by query (e.g. ?type=video)
        const filter = { status: 'approved' };
        if (req.query.type) {
            filter.mediaType = req.query.type; // 'image' or 'video'
        }

        const posts = await Post.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'name role operationRole')
            .populate('comments.user', 'name');

        const total = await Post.countDocuments(filter);

        res.json({
            posts,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, category, mediaUrl, mediaType } = req.body;

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check ownership
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this post' });
        }

        post.description = description || post.description;
        post.category = category || post.category;

        // If updating media, logic might be more complex (re-check AI?), for now assume simple edit
        if (mediaUrl) post.mediaUrl = mediaUrl;
        if (mediaType) post.mediaType = mediaType;

        // If content changed significantly, maybe reset status to 'pending'? 
        // For simplicity in this sprint, we trust the edit or re-run simple check.
        // Let's just save.

        await post.save();
        await post.populate('author', 'name role operationRole');

        res.json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check permissions: Author OR Supervisor OR Admin
        const isAuthor = post.author.toString() === req.user._id.toString();
        const isSupervisor = req.user.role === 'supervisor' || req.user.role === 'admin';

        if (!isAuthor && !isSupervisor) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        await post.deleteOne();
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id)
            .populate('author', 'name role operationRole')
            .populate('comments.user', 'name role operationRole');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const posts = await Post.find({ author: userId })
            .sort({ createdAt: -1 })
            .populate('author', 'name role operationRole')
            .populate('comments.user', 'name');
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Toggle Like
export const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const index = post.likes.indexOf(req.user._id);
        if (index === -1) {
            post.likes.push(req.user._id);

            // Notify Author if not self
            if (post.author.toString() !== req.user._id.toString()) {
                const notification = await Notification.create({
                    recipient: post.author,
                    sender: req.user._id,
                    type: 'like',
                    post: post._id,
                    message: `liked your post`
                });

                if (req.io) {
                    req.io.to(post.author.toString()).emit('notification', notification);
                }
            }
        } else {
            post.likes.splice(index, 1);
        }

        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!text) return res.status(400).json({ message: 'Text is required' });

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const newComment = {
            user: req.user._id,
            text,
            createdAt: new Date()
        };

        post.comments.push(newComment);
        await post.save();

        await post.populate('comments.user', 'name role operationRole');

        // Notify Author if not self
        if (post.author.toString() !== req.user._id.toString()) {
            const notification = await Notification.create({
                recipient: post.author,
                sender: req.user._id,
                type: 'comment',
                post: post._id,
                message: `commented: "${text.substring(0, 20)}..."`
            });
            if (req.io) req.io.to(post.author.toString()).emit('notification', notification);
        }

        res.json(post.comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const post = await Post.findById(id);

        if (!post) return res.status(404).json({ message: 'Post not found' });

        const comment = post.comments.id(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        // Check permission
        const isCommentAuthor = comment.user.toString() === req.user._id.toString();
        const isPostAuthor = post.author.toString() === req.user._id.toString();
        const isSupervisor = req.user.role === 'supervisor' || req.user.role === 'admin';

        if (!isCommentAuthor && !isPostAuthor && !isSupervisor) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Mongoose subdocument removal
        // Note: In Mongoose 7, .remove() is gone? use .deleteOne() on subdoc or .pull()
        post.comments.pull(commentId);
        await post.save();

        res.json({ message: 'Comment deleted', comments: post.comments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
