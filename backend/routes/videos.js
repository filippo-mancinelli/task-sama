const { connectToDatabase } = require('../db');
const Router = require('@koa/router');
const router = new Router();
const multer = require('@koa/multer');
const upload = multer({ dest: "uploads/videos" }); 
const fs = require('fs');


/* 
###############################################################
####################### uploadVideoToDB #######################
############################################################### 
*/
router.post('/uploadVideoToDB', upload.single('file'), async (ctx, next) => {
  if (ctx.request.path === '/uploadVideoToDB') {
    console.log("\n ####################################### \n '/uploadVideoToDB' " + new Date() + "\n ####################################### \n ");

    const video = ctx.request.file; 
    const taskId = ctx.request.body.tokenId;
    const walletAddress = ctx.headers['x-wallet-address'];
   
    try {
      const dir = `./uploads/videos/${taskId}/${walletAddress}`;
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
      }
      const tempFilePath = 'uploads/videos/' + video.filename;
      const newFilePath = `uploads/videos/${taskId}/${walletAddress}/` + video.originalname;
      fs.rename(tempFilePath, newFilePath, (err) => {
        if (err) {
          console.error('Error renaming file:', err);
        } else {
          console.log('File renamed successfully.');
        }
      });

      const db = await connectToDatabase();
      const collection = db.collection('videos');
      
      const currentDate = new Date();
      const formattedDate = formatDateToString(currentDate);

      // Insert the video information into the "videos" collection
      const videoData = {
        name: video.originalname,
        path: newFilePath,
        uploadDate: formattedDate,
        size: video.size,
        taskId: taskId,
        senderAddress: walletAddress
      };

      await collection.insertOne(videoData);
      console.log("doc inserted");

      ctx.body = {
        message: 'Video uploaded and saved successfully.',
        data: videoData,
      };
    } catch (error) {
      ctx.throw(500, 'Failed to upload and save the video.', error);
    }
  }
  await next();

  if (ctx.status === 404) {
    ctx.body = {
      message: 'Not found',
    };
  }
});


/* 
###############################################################
################### getParticipantVideo #####################
############################################################### 
*/
router.get('/getParticipantVideo', async (ctx, next) => {
  if (ctx.request.path === '/getParticipantVideo') { 
    console.log("\n ####################################### \n '/getParticipantVideo' \n ####################################### \n ");

    const participantAddress = ctx.request.query.participantAddress;
    const tokenId = ctx.request.query.tokenId;

    let videoData;
    try {
      const db = await connectToDatabase();
      const collection = db.collection('videos');
      const video = await collection.findOne({ 'taskId': tokenId, 'senderAddress': participantAddress });
      console.log("video.path", video.path);

      const filePath = video.path
      console.log('Looking for: ',filePath)
      if (fs.existsSync(filePath)) {
        videoData = fs.readFileSync(filePath);
        console.log('Found!')
      } else {
        ctx.throw(404, 'Video not found');
      }
      
      ctx.type = 'video/mp4';
      ctx.body = {
        message: 'Video retrieved successfully.',
        data: videoData,
      };
    } catch (error) {
      ctx.throw(500, 'Failed to retrieve video.', error);
    }
  }
  await next();

  if (ctx.status === 404) {
    ctx.body = {
      message: 'Not found',
    };
  }
});

/* 
###############################################################
############################ UTILS ############################
############################################################### 
*/
function formatDateToString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
module.exports = router;
