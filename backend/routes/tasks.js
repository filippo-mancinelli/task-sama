const Router = require('@koa/router');
const router = new Router();
const { ethers } = require("ethers");
const { tasksAddress } = require('../helpers/contractAddresses');
const tasksABI = require("../helpers/TasksABI.json");
const { connectToDatabase } = require('../db');

const provider = ethers.getDefaultProvider("http://localhost:8545/"); //ganache
const taskContract = new ethers.Contract(tasksAddress, tasksABI.abi, provider);


/* Fetch all current active tasks on-chain.
###############################################################
######################## getTasks #############################
############################################################### */

router.get('/getTasks', async (ctx, next) => {
    if(ctx.request.path === '/getTasks') {
      console.log("\n ####################################### \n '/getTasks' " + new Date() + "\n ####################################### \n ");
  
        let taskList;
        try {
            taskList = await taskContract._getTasks(); 
          } catch (error) {
            console.error("Error calling _getTasks():", error);
          }

          // Restructure the transformation to directly assign new properties
          taskList = taskList.map(task => ({
            tokenId: task.tokenId.toString(),
            owner: task[1],
            title: task[2],
            description: task[3],
            reward: parseFloat(ethers.formatEther(task[4])),
            participants: task[5]
          }));

      ctx.body = {
        message: 'list of current active tasks',
        data: taskList,
      };
    } 
    await next();
});

/* 
###############################################################
######################## getTask ##############################
############################################################### */

router.get('/getTask', async (ctx, next) => {
  if(ctx.request.path === '/getTask') {
    console.log("\n ####################################### \n '/getTask' " + new Date() + "\n ####################################### \n ");
    
    const taskId = ctx.request.query.taskId;
    
    const taskObj = await taskContract._getTask(taskId); 
    const taskResponse = { ...taskObj };

    // Convert specific properties to desired types
    taskResponse['0'] = taskResponse['0'].toString();
    taskResponse['4'] = parseFloat(ethers.formatEther(taskResponse['4']));
  

    
    console.log("taskResponse", taskResponse)
    ctx.body = {
      message: 'Task object retrieved successfully.',
      data: taskResponse,
    };
  } 
  await next();
});

/* Fetch all current active tasks on-chain that have videos still to be moderated.
###############################################################
################## getTasksToModerate ########################
############################################################### */
router.get('/getTasksToModerate', async (ctx, next) => {
  if(ctx.request.path === '/getTasksToModerate') {
    console.log("\n ####################################### \n '/getTasksToModerate' " + new Date() + "\n ####################################### \n ");

    // Retrieve list of task ids on-chain
    let taskList;
    try {
        taskList = await taskContract._getTasks(); 
      } catch (error) {
        console.error("Error calling _getTasks():", error);
      }
      const taskIds = taskList.map(task => task.tokenId.toString());
      taskList = taskList.map(task => ({
        tokenId: task.tokenId.toString(),
        owner: task[1],
        title: task[2],
        description: task[3],
        reward: parseFloat(ethers.formatEther(task[4])),
        participants: task[5]
      }));
      console.log("taskIds",taskIds)


      // Find videos with moderated == false for the given taskIds
      let taskIdsWithNotModeratedVideos;
      try {
        const db = await connectToDatabase();
        const collection = db.collection('videos');    
        
        const videosNotModerated = await collection.find({
          taskId: { $in: taskIds },
          moderated: false,
        }).toArray();
        console.log("videosNotModerated",videosNotModerated)


        // Extract the unique taskIds from videos with unmoderated flag
        taskIdsWithNotModeratedVideos = [...new Set(videosNotModerated.map(video => video.taskId))];
        console.log("taskIdsWithNotModeratedVideos",taskIdsWithNotModeratedVideos)

        // Filter taskList based on the taskIds that have unmoderated videos
        taskList = taskList.filter(task => taskIdsWithNotModeratedVideos.includes(task.tokenId.toString()));

        console.log("taskList", taskList);

      } catch (error) {
        console.error("Error fetching videos from db():", error)
      }

    ctx.body = {
      message: 'list of current active tasks with videos to be moderated',
      data: taskList,
    };
  } 
  await next();
});

/* 
###############################################################
########################## reminder ###########################
############################################################### 
*/
router.post('/reminder', async (ctx, next) => {
  if (ctx.request.path === '/reminder') {
    console.log("\n ####################################### \n '/reminder' " + new Date() + "\n ####################################### \n ");

    const taskId = ctx.request.body.tokenId;
    const participantAddress = ctx.request.body.participantAddress;

    try {
      const db = await connectToDatabase();
      const collection = db.collection('reminders');

      // Check if reminder already exists, if yes then just update the counter, else insert a new one.
      const existingReminder = await collection.findOne({ taskId, participantAddress });

      if (existingReminder) {
        await collection.updateOne(
          { taskId, participantAddress },
          { $inc: { counter: 1 } }
        );
      } else {
        await collection.insertOne({
          taskId,
          participantAddress,
          counter: 1
        });
      }

      ctx.body = {
        message: 'Reminder inserted succesfully.'
      };

    } catch (error) {
      ctx.throw(500, 'Failed to insert/update reminder.', error);
    }
  }
  await next();
});

module.exports = router;