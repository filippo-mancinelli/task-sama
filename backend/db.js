require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

const mongoUrl = process.env.MONGO_URL;
const dbName = 'task-sama';

let db;

async function connectToDatabase() {
  if (db) {
    return db;
  }

  try {
    const client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db(dbName);
    console.log(`Connected to database ${dbName} as ${process.env.MONGO_USERNAME}`);

    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
  }
}


module.exports = { connectToDatabase };
