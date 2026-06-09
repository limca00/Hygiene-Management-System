import mongoose from 'mongoose';
import Fpr from '../backend/models/Fpr.js';

const uri = 'mongodb+srv://HygieneAdmin:HygieneAdmin%40123@cluster0.lqq6yyq.mongodb.net/hms_db?appName=Cluster0';

async function run() {
  await mongoose.connect(uri);
  console.log('Connected');
  
  const fpr = await Fpr.findOne({});
  console.log('FPR document directly:', fpr);
  console.log('FPR toJSON:', fpr.toJSON());
  console.log('FPR.id property:', fpr.id);
  console.log('FPR._id property:', fpr._id);
  
  await mongoose.disconnect();
}

run().catch(console.error);
