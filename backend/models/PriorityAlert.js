import mongoose from 'mongoose';

const PriorityAlertSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    recordId: { type: String, required: true },
    areaId: { type: String, required: true },
    areaName: { type: String },
    section: { type: String },
    date: { type: String },
    shift: { type: String },
    auditor: { type: String },
    checkpointName: { type: String, required: true },
    status: { type: String, enum: ['PARTIAL', 'FAIL'], required: true },
    reason: { type: String }
}, { timestamps: true });

export default mongoose.model('PriorityAlert', PriorityAlertSchema);
