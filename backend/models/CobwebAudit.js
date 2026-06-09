import mongoose from 'mongoose';

const CobwebAuditSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    date: { type: String, required: true }, // Format: "DD-MM-YYYY"
    areaName: { type: String, required: true },
    auditor: { type: String, required: true },
    inspectionTime: { type: String, required: true },
    score: { type: Number, required: true },
    status: { type: String, required: true },
    remarks: { type: String, default: '' },
    beforePhoto: { type: String, default: '' },
    afterPhoto: { type: String, default: '' }
}, { timestamps: true, id: false });

export default mongoose.model('CobwebAudit', CobwebAuditSchema);
