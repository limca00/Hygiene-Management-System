import express from 'express';
const router = express.Router();
import CobwebSchedule from '../models/CobwebSchedule.js';
import CobwebAudit from '../models/CobwebAudit.js';
import PriorityAlert from '../models/PriorityAlert.js';

const masterSchedules = [
  { date: "19-05-2026", areas: ["Agrolab", "Battery Room", "Maida Sieving Room", "Potato Cold Storage Exit Way"] },
  { date: "20-05-2026", areas: ["Potato Cold Storage", "RM Area"] },
  { date: "21-05-2026", areas: ["RM Racks"] },
  { date: "22-05-2026", areas: ["Passage In Front of Lab", "Potato Feeder", "Retention Room"] },
  { date: "23-05-2026", areas: ["Starch Room", "PC Scrap Room", "Scrap Outside Area"] },
  { date: "25-05-2026", areas: ["PC Process (Peeler, Slicer, Blancher, Fryer, Optyx)"] },
  { date: "26-05-2026", areas: ["Seasoning", "Packaging", "Taping Area", "Engineering Store"] },
  { date: "27-05-2026", areas: ["ODS Room", "Seasoning Storage Room"] },
  { date: "28-05-2026", areas: ["PM Area", "PM Dock"] },
  { date: "29-05-2026", areas: ["Premixing"] },
  { date: "30-05-2026", areas: ["Mixing", "Moulding", "Flavour Room", "Weighment Room"] },
  { date: "01-06-2026", areas: ["Oven"] },
  { date: "02-06-2026", areas: ["Wire Cut Line"] },
  { date: "03-06-2026", areas: ["Sandwich Section"] },
  { date: "04-06-2026", areas: ["Bourbon Cooling Conveyor"] },
  { date: "05-06-2026", areas: ["Cooling Tunnel", "Cream Preparation Room", "Sugar Room"] },
  { date: "06-06-2026", areas: ["Packaging", "Biscuit Scrap Area"] },
  { date: "08-06-2026", areas: ["FG Warehouse"] },
  { date: "09-06-2026", areas: ["FG Warehouse"] },
  { date: "10-06-2026", areas: ["FG Warehouse"] },
  { date: "11-06-2026", areas: ["Canteen", "Admin Building"] },
  { date: "12-06-2026", areas: ["Nitrogen Room", "WTP", "Main Scrap Area (All 4 Rooms)"] },
  { date: "13-06-2026", areas: ["Medical Block / Creche"] },
  { date: "15-06-2026", areas: ["Driver Parking Room", "Security Room", "Time Office"] },
  { date: "16-06-2026", areas: ["ETP Area"] },
  { date: "17-06-2026", areas: ["Chemical Room", "Pest Control Room", "HK Room"] },
  { date: "18-06-2026", areas: ["Entrance Area", "Wash Room"] },
  { date: "19-06-2026", areas: ["Utility Block"] },
  { date: "20-06-2026", areas: ["Utility Block"] },
  { date: "22-06-2026", areas: ["Pending Work"] }
];

// GET /api/cobweb-schedule
router.get('/cobweb-schedule', async (req, res) => {
    try {
        let schedules = await CobwebSchedule.find().sort({ createdAt: 1 });
        if (schedules.length === 0) {
            console.log('Seeding master schedules...');
            await CobwebSchedule.insertMany(masterSchedules);
            schedules = await CobwebSchedule.find().sort({ createdAt: 1 });
        }
        res.status(200).json(schedules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/cobweb-audit
router.get('/cobweb-audit', async (req, res) => {
    try {
        const audits = await CobwebAudit.find().sort({ createdAt: -1 });
        res.status(200).json(audits);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/cobweb-audit
router.post('/cobweb-audit', async (req, res) => {
    try {
        const audit = new CobwebAudit(req.body);
        await audit.save();

        // If score < 60, create a PriorityAlert record in the DB
        if (audit.score < 60) {
            const alertId = `ALERT-COBWEB-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const alert = new PriorityAlert({
                id: alertId,
                recordId: audit.id,
                areaId: 'cobweb_recleaning',
                areaName: audit.areaName,
                section: 'COMMON',
                date: audit.date,
                shift: 'P',
                auditor: audit.auditor,
                checkpointName: 'Cobweb Recleaning Required',
                status: 'FAIL',
                reason: audit.remarks || 'Recleaning required for cobwebs.',
                isAssigned: false
            });
            await alert.save();
        }

        res.status(201).json(audit);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
