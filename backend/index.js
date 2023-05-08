const Koa = require('koa');
const MongoClient = require('mongodb').MongoClient;

const app = new Koa();
const mongoUrl = 'mongodb://localhost:27017'; 
const dbName = 'task-sama';

let db;

(async () => {
  try {
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    db = client.db(dbName);
    console.log(`Connected to database ${dbName}`);

    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
  }
})();

app.use(async (ctx, next) => {
  const collection = db.collection('images');

  // Test query: find all documents in the collection
  const documents = await collection.find({}).toArray();

  ctx.body = {
    message: `Documents in the ${collectionName} collection:`,
    data: documents,
  };

  await nexSt();
});

