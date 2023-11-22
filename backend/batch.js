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
// it means that the task has been completed and removed, hence we can remove all the non-winner participant videos 
// both on disk and DB
cron.schedule("*/5 * * * *", async () => {
  console.log("Starting job: PurgeVideos&DB");

  const tasks = await fetchActiveTask();
  const db = await connectToDatabase();
  const collection = db.collection('videos');
  const videoDocuments = await collection.find({}).toArray();

  for (const video of videoDocuments) {
    let found = false;
    tasks.forEach(task => {
      if (task.tokenId == video.taskId) {
        found = true;
      }
    });

    // found === false means that for this video, there is no active task on-chain, hence we can delete it
    if (found === false) { 
      const filePath = video.path;

      if (fs.existsSync(filePath)) {
        // Delete the directory and its contents up to the folder corresponding to the taskId, for example "13"
        const directoryPath = path.dirname(filePath);
        const targetFolder = path.join(directoryPath, video.taskId);

        console.log('Target folder to delete:', targetFolder);

        if (fs.existsSync(targetFolder)) {
          fs.rmdirSync(targetFolder, { recursive: true });
          console.log('Directory and its contents deleted successfully.');
        } else {
          console.log("Directory not found");
        }

      } else {
        console.log("File not found");
      }

      // In either case we find the file to be removed or not, we must still remove documents from DB 
      const resultVideo = await collection.deleteMany({ taskId: video.taskId }, (err, result) => {
        if (err) {
          console.error("Error while deleting videos document:", err);
        } else {
          console.log("Document deleted successfully.");
        }
      });
      collection = db.collection('reminders');
      const resultReminder = await collection.deleteMany({ taskId: video.taskId }, (err, result) => {
        if (err) {
          console.error("Error while deleting reminders document:", err);
        } else {
          console.log("Document deleted successfully.");
        }
      });
      collection = db.collection('images');
      const resultImages = await collection.deleteMany({ taskId: video.taskId }, (err, result) => {
        if (err) {
          console.error("Error while deleting images document:", err);
        } else {
          console.log("Document deleted successfully.");
        }
      });
      console.log("video deletion from db: ",resultVideo)
      console.log("reminder deletion from db: ",resultReminder)
      console.log("images deletion from db: ",resultImages)
    }
  }

  console.log("Finished job: PurgeVideos&DB")
});