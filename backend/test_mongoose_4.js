import mongoose from 'mongoose';
import Fpr from './models/Fpr.js';

const uri = 'mongodb+srv://HygieneAdmin:HygieneAdmin%40123@cluster0.lqq6yyq.mongodb.net/hms_db?appName=Cluster0';

async function run() {
  console.log('Connecting...');
  await mongoose.connect(uri);
  console.log('Connected');
  
  try {
    const docId = 'FPR-1776076479918-npr97or';
    console.log('Querying for id:', docId);
    
    // Find
    const fpr1 = await Fpr.findOne({ id: docId });
    console.log('FindOne result:', fpr1 ? 'Found' : 'Not Found');
    
    // Update
    const fpr2 = await Fpr.findOneAndUpdate(
      { id: docId },
      { actionTaken: 'Updated action ' + new Date().toISOString() },
      { new: true }
    );
    console.log('findOneAndUpdate result:', fpr2 ? 'Found & Updated' : 'Not Found/Null');
    if (fpr2) {
      console.log('Updated actionTaken:', fpr2.actionTaken);
    }
  } catch (err) {
    console.error('Error during update:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(console.error);
