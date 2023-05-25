const MongoClient = require('mongodb').MongoClient;

const mongoUrl = process.env.MONGO_URL;
const dbName = 'task-sama';

let db;

async function connectToDatabase() {
  if (db) {
    return db;
  }

  try {
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    db = client.db(dbName);
    console.log(`Connected to database ${dbName}`);

    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
  }
}


module.exports = { connectToDatabase };
