const cron = require("node-cron");
const ethers = require("ethers");
const { tasksAddress, tasksamaAddress } = require('./helpers/contractAddresses');
const TasksABI = require("./helpers/TasksABI.json");
const TasksamaABI = require("./helpers/TasksamaABI.json");
const fs = require('fs');
const ganacheUrl = process.env.NODE_ENV === 'production' ? process.env.GANACHE_URL_PROD : process.env.GANACHE_URL_DEV;
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
//cron.schedule('*/20 * * * * *', async () => {
cron.schedule("*/20 * * * *", async () => {
  console.log("Starting job: PurgeVideos&DB");

  const tasks = await fetchActiveTask();
  const db = await connectToDatabase();
  var collection = db.collection('videos');
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
      const dirPath = 'uploads/videos/' + video.taskId;
      if (fs.existsSync(dirPath)) {
        fs.rm(dirPath, { recursive: true }, (error) => {
          if (error) {
            console.error("Error while deleting directory:", error);
          } else {
            console.log("Directory and its contents deleted successfully");
          }
        });
      } else {
        console.log("Directory not found");
      }

      // In either case we find the file to be removed or not, we must still remove documents from DB 
      const resultVideo = await collection.deleteMany({ taskId: video.taskId }, (err) => {
        if (err) {
          console.error("Error while deleting videos document:", err);
        } else {
          console.log("Document deleted successfully.");
        }
      });
      collection = db.collection('reminders');
      const resultReminder = await collection.deleteMany({ taskId: video.taskId }, (err) => {
        if (err) {
          console.error("Error while deleting reminders document:", err);
        } else {
          console.log("Video document deleted successfully.");
        }
      });

      console.log("video deletion from db: ",resultVideo)
      console.log("reminder deletion from db: ",resultReminder)
    }
  } 

  try {
    collection = db.collection('images');
    const imageDocuments = await collection.find({}).toArray();
  
    for (const image of imageDocuments) {
      let found = false;
      tasks.forEach(task => {
        if (task.tokenId == image.taskId) {
          found = true;
        }
      });

    // found === false means that for this image, there is no active task on-chain, hence we can delete it
      if (found === false) { 
        const dirPath = 'uploads/images/' + image.taskId;
        if (fs.existsSync(dirPath)) {
          try {
            await new Promise((resolve, reject) => {
              fs.rm(dirPath, { recursive: true }, (error) => {
                if (error) {
                  console.error("Error while deleting directory:", error);
                  reject(error);
                } else {
                  console.log("Directory and its contents deleted successfully");
                  resolve();
                }
              });
            });
          } catch (error) {
            console.error("Error while deleting directory:", error);
          }
        } else {
          console.log("Directory not found");
        }
    
        const resultImages = await collection.deleteMany({ taskId: image.taskId }, (err) => {
          if (err) {
            console.error("Error while deleting images document:", err);
          } else {
            console.log("Image document deleted successfully.");
          }
        });
        console.log("image deletion from db: ",resultImages);
      }
    }
  } catch(error) {
    console.error("Error while deleting directory:", error);
  }


  console.log("Finished job: PurgeVideos&DB")
});