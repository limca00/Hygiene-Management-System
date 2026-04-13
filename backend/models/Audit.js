import mongoose from 'mongoose';

const CheckpointResultSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: { type: String, enum: ['PASS', 'PARTIAL', 'FAIL'], required: true },
    reason: { type: String }
});

const AreaAuditSchema = new mongoose.Schema({
    areaId: { type: String, required: true },
    checkpoints: [CheckpointResultSchema],
    areaScore: { type: Number, required: true },
    areaPercentage: { type: Number, required: true }
});

const AuditSchema = new mongoose.Schema({
    date: { type: String, required: true },
    shift: { type: String, enum: ['P', 'Q', 'R'], required: true },
    auditor: { type: String, required: true },
    areas: [AreaAuditSchema]
}, { timestamps: true });

// Ensure unique audit per date and shift
AuditSchema.index({ date: 1, shift: 1 }, { unique: true });

export default mongoose.model('Audit', AuditSchema);
