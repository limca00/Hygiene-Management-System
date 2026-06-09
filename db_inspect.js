import mongoose from 'mongoose';

const uri = 'mongodb+srv://HygieneAdmin:HygieneAdmin%40123@cluster0.lqq6yyq.mongodb.net/hms_db?appName=Cluster0';

async function run() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
  
  const fprs = await mongoose.connection.collection('fprs').find({}).toArray();
  console.log('--- FPRS ---');
  console.log(JSON.stringify(fprs, null, 2));
  
  const alerts = await mongoose.connection.collection('priorityalerts').find({}).toArray();
  console.log('--- ALERTS ---');
  console.log(JSON.stringify(alerts, null, 2));

  const audits = await mongoose.connection.collection('audits').find({}).toArray();
  console.log('--- AUDITS ---');
  console.log(JSON.stringify(audits, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);

