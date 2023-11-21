const cron = require("node-cron");
const ethers = require("ethers");
const { tasksAddress, tasksamaAddress } = require('./helpers/contractAddresses');
const TasksABI = require("./helpers/TasksABI.json");
const TasksamaABI = require("./helpers/TasksamaABI.json");
const fs = require('fs');
const ganacheUrl = "http://localhost:8545";
const { connectToDatabase } = require('./db');

async function fetchActiveTask() {
  try {
    const provider = new ethers.JsonRpcProvider(ganacheUrl);
    const taskContract = new ethers.Contract(tasksAddress, TasksABI.abi, provider);
    const result = await taskContract._getTasks();

    //console.log("Fetched data:", result);
    return result;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Fetch Tasks NFTs on-chain and compare with DB registry of videos stored on the server, if there is no matchup,
// it means that the task has been completed and removed, hence we can remove all the non-winner participant videos on disk
cron.schedule("*/5 * * * *", async () => {
  console.log("Fetching ongoing tasks from smart contract...");
  const tasks = await fetchActiveTask();
  console.log("Tasks fetched");

  const db = await connectToDatabase();
  console.log("Fetching documents of stored videos from MongoDB...");
  const collection = db.collection('videos');
  const videoDocuments = await collection.find({}).toArray();
  console.log("Documents fetched");

  for (const video of videoDocuments) {
    let found = false;
    tasks.forEach(task => {
      if (task.tokenId == video.taskId) {
        found = true;
      }
    });

    if (found === false) {
      const filePath = video.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('File deleted successfully.');
        
        // Wait some time to complete the file deletion
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Delete the directory and its contents up to the folder corresponding to the taskId, for example "13"
        const directoryPath = path.dirname(filePath);
        const targetFolder = path.join(directoryPath, video.taskId);

        if (fs.existsSync(targetFolder)) {
          fs.rmdirSync(targetFolder, { recursive: true });
          console.log('Directory and its contents deleted successfully.');
        } else {
          console.log("Directory not found");
        }

        collection.deleteMany({ taskId: video.taskId }, (err, result) => {
          if (err) {
            console.error("Error while deleting document:", err);
          } else {
            console.log("Document deleted successfully.");
          }
        });
      } else {
        console.log("File not found");
      }
    }
  }
});