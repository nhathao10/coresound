/**
 * Script copy toàn bộ database từ local MongoDB sang Atlas
 * Chạy: node migrate-db.js
 */
const { MongoClient } = require('./backend/node_modules/mongodb');

const SOURCE_URI = 'mongodb://localhost:27017';
const TARGET_URI = 'mongodb+srv://coresound:10102003@cluster0.xtiasje.mongodb.net';
const DB_NAME = 'coresound';

async function migrate() {
  console.log('Connecting to local MongoDB...');
  const sourceClient = new MongoClient(SOURCE_URI);
  await sourceClient.connect();
  const sourceDb = sourceClient.db(DB_NAME);

  console.log('Connecting to Atlas...');
  const targetClient = new MongoClient(TARGET_URI);
  await targetClient.connect();
  const targetDb = targetClient.db(DB_NAME);

  const collections = await sourceDb.listCollections().toArray();
  console.log(`Found ${collections.length} collections to migrate:\n`);

  for (const col of collections) {
    const name = col.name;
    const sourceCol = sourceDb.collection(name);
    const targetCol = targetDb.collection(name);
    
    const count = await sourceCol.countDocuments();
    process.stdout.write(`  ${name}: ${count} documents ... `);
    
    if (count === 0) {
      console.log('Skipped (empty)');
      continue;
    }

    const docs = await sourceCol.find({}).toArray();
    await targetCol.deleteMany({});
    await targetCol.insertMany(docs);
    console.log('Done!');
  }

  console.log('\nCopying indexes...');
  for (const col of collections) {
    const name = col.name;
    const sourceCol = sourceDb.collection(name);
    const targetCol = targetDb.collection(name);
    
    const indexes = await sourceCol.indexes();
    for (const index of indexes) {
      if (index.name === '_id_') continue;
      try {
        const { key, ...options } = index;
        delete options.v;
        delete options.ns;
        await targetCol.createIndex(key, options);
      } catch (err) {
        // Index might already exist, skip
      }
    }
  }

  console.log('\nMigration complete!');
  await sourceClient.close();
  await targetClient.close();
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
