/**
 * Script kiểm tra nội dung database Atlas
 * Chạy: node check-atlas.js
 */
const { MongoClient } = require('./backend/node_modules/mongodb');

const TARGET_URI = 'mongodb+srv://coresound:10102003@cluster0.xtiasje.mongodb.net';
const DB_NAME = 'coresound';

async function check() {
  console.log('🔗 Connecting to Atlas...');
  const client = new MongoClient(TARGET_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  const collections = await db.listCollections().toArray();
  console.log(`📦 Collections in ${DB_NAME}:`);

  for (const col of collections) {
    const name = col.name;
    const count = await db.collection(name).countDocuments();
    process.stdout.write(`  📄 ${name}: ${count} documents `);
    
    if (count > 0) {
      const sample = await db.collection(name).findOne({});
      console.log(`- Sample ID: ${sample._id}`);
      if (name === 'curatedplaylists') {
        process.stdout.write(`    (isPublic: ${sample.isPublic}) `);
      }
    }
    console.log('');
  }

  await client.close();
}

check().catch(err => {
  console.error('❌ Check failed:', err.message);
  process.exit(1);
});
