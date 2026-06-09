import mongoose from 'mongoose';

const CobwebScheduleSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true }, // Format: "DD-MM-YYYY"
    areas: [{ type: String, required: true }]
}, { timestamps: true, id: false });

export default mongoose.model('CobwebSchedule', CobwebScheduleSchema);
