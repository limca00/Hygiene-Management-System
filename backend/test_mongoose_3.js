import mongoose from 'mongoose';
import Fpr from './models/Fpr.js';

const uri = 'mongodb+srv://HygieneAdmin:HygieneAdmin%40123@cluster0.lqq6yyq.mongodb.net/hms_db?appName=Cluster0';

async function run() {
  console.log('Connecting...');
  await mongoose.connect(uri);
  console.log('Connected');
  
  try {
    const fpr = await Fpr.findOne({});
    if (fpr) {
      console.log('Found document!');
      console.log('toJSON():', JSON.stringify(fpr.toJSON(), null, 2));
      console.log('id property:', fpr.id);
      console.log('_id property:', fpr._id);
    } else {
      console.log('No documents found in fprs collection');
    }
  } catch (err) {
    console.error('Error during query:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(console.error);
