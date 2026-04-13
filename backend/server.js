import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import apiRoutes from './routes/api.js';

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hms_db';
mongoose.connect(MONGO_URI)
 .then(() => console.log('MongoDB connected'))
 .catch(err => console.error(err));

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
    });
}

export default app;
