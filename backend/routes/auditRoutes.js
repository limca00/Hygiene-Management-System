import express from 'express';
const router = express.Router();
import Audit from '../models/Audit.js';
import PriorityAlert from '../models/PriorityAlert.js';

// Save or Update Audit Record
router.post('/audits', async (req, res) => {
    try {
        const { id, date, shift, auditor, areas } = req.body;
        let audit = await Audit.findOne({ date, shift });
        if (audit) {
            // Merge areas
            areas.forEach(newArea => {
                const existingIdx = audit.areas.findIndex(a => a.areaId === newArea.areaId);
                if (existingIdx >= 0) {
                    audit.areas[existingIdx] = newArea;
                } else {
                    audit.areas.push(newArea);
                }
            });
            audit.auditor = auditor;
            await audit.save();
        } else {
            // Create new record
            audit = new Audit({ id, date, shift, auditor, areas });
            await audit.save();
        }
        res.status(200).json(audit);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Audit Records
router.get('/audits', async (req, res) => {
    try {
        const audits = await Audit.find();
        res.status(200).json(audits);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create or Update Alert
router.post('/alerts', async (req, res) => {
    try {
        const { recordId, areaId, checkpointName, status, reason } = req.body;
        let alert = await PriorityAlert.findOne({ recordId, areaId, checkpointName });
        
        if (!alert) {
            alert = new PriorityAlert(req.body);
            await alert.save();
        } else {
            // Update existing alert status/reason
            alert.status = status;
            alert.reason = reason;
            await alert.save();
        }
        res.status(201).json(alert);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Unassigned Alerts
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await PriorityAlert.find({ isAssigned: false });
        res.status(200).json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Alert (Legacy/optional)
router.delete('/alerts/:id', async (req, res) => {
    try {
        await PriorityAlert.findOneAndDelete({ id: req.params.id });
        res.status(200).json({ message: "Alert deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark Alert as Assigned
router.patch('/alerts/:id', async (req, res) => {
    try {
        const alert = await PriorityAlert.findOneAndUpdate(
            { id: req.params.id },
            { isAssigned: true },
            { new: true }
        );
        res.status(200).json(alert);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
