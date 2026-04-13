import mongoose from 'mongoose';

const FprSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    fprId: { type: Number, required: true },
    area: { type: String, required: true },
    section: { type: String, required: true },
    issue: { type: String, required: true },
    checkpointStatus: { type: String, enum: ['PARTIAL', 'FAIL'], required: true },
    assignPerson: { type: String, required: true },
    targetDate: { type: String },
    status: { type: String, enum: ['OPEN', 'IN PROGRESS', 'CLOSED'], default: 'OPEN' },
    actionTaken: { type: String, default: '' },
    openDate: { type: String },
    closeDate: { type: String, default: null },
    shift: { type: String },
    auditor: { type: String },
    date: { type: String }
}, { timestamps: true });

export default mongoose.model('Fpr', FprSchema);
