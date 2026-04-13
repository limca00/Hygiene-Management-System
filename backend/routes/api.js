const express = require('express');
const router = express.Router();
const Audit = require('../models/Audit');
const Fpr = require('../models/Fpr');
const PriorityAlert = require('../models/PriorityAlert');

// Save or Update Audit Record
router.post('/audits', async (req, res) => {
    try {
        const { id, date, shift, auditor, areas } = req.body;
        const audit = await Audit.findOneAndUpdate(
            { date, shift },
            { date, shift, auditor, areas },
            { new: true, upsert: true }
        );
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

// Create Alert
router.post('/alerts', async (req, res) => {
    try {
        const alert = new PriorityAlert(req.body);
        await alert.save();
        res.status(201).json(alert);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Alerts
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await PriorityAlert.find();
        res.status(200).json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Alert
router.delete('/alerts/:id', async (req, res) => {
    try {
        await PriorityAlert.findOneAndDelete({ id: req.params.id });
        res.status(200).json({ message: "Alert deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

// Get FPRs
router.get('/fprs', async (req, res) => {
    try {
        const fprs = await Fpr.find();
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

module.exports = router;
