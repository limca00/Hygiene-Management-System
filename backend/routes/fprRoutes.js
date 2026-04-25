import express from 'express';
const router = express.Router();
import Fpr from '../models/Fpr.js';

// Create FPR
router.post('/fprs', async (req, res) => {
    try {
        const fpr = new Fpr(req.body);
        await fpr.save();
        res.status(201).json(fpr);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get FPRs with optional status and limit filters
router.get('/fprs', async (req, res) => {
    try {
        const { status, limit } = req.query;
        let query = {};
        if (status) {
            if (status === 'OPEN') {
                query.status = { $ne: 'CLOSED' }; // Everything not closed is considered OPEN in the dashboard view
            } else {
                query.status = status;
            }
        }
        
        let fprsQuery = Fpr.find(query);
        if (limit) {
            fprsQuery = fprsQuery.limit(parseInt(limit, 10));
        }
        // sort by newest
        fprsQuery = fprsQuery.sort({ createdAt: -1 });

        const fprs = await fprsQuery.exec();
        res.status(200).json(fprs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update FPR
router.put('/fprs/:id', async (req, res) => {
    try {
        const fpr = await Fpr.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        res.status(200).json(fpr);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Close FPR
router.patch('/fprs/:id/close', async (req, res) => {
    try {
        const fpr = await Fpr.findOneAndUpdate(
            { id: req.params.id },
            { 
                status: 'CLOSED',
                actionTaken: req.body.actionTaken || 'Closed via dashboard',
            },
            { new: true }
        );
        res.status(200).json(fpr);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
