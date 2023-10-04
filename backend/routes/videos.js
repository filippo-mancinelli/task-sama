const { connectToDatabase } = require('../db');
const Router = require('@koa/router');
const router = new Router();
const multer = require('@koa/multer');
const upload = multer({ dest: "uploads/videos" }); 
const fs = require('fs');
const { PassThrough } = require('stream'); 
const { FilebaseClient, File } = require('@filebase/client');
const filebaseClient = new FilebaseClient({ token: process.env.FILEBASE_API_TOKEN });
require('dotenv').config();

/*
// IPFS NODE SETUP 
let node;
async function createIPFSNode() {
  const ipfsCoreModule = await import('ipfs-core');
  node = await ipfsCoreModule.create();
}

let create;
let client;
async function fetchIPFSContent() {
  const ipfsModule = await import('ipfs-http-client');
  create = ipfsModule.create;
  client = create('http://localhost:4003');

  const data = client.cat('ipfs://bafyreiflow4tomncjhdqfzalwaevjsipcgyu7xtf6o5puiycgctsgnyab4/metadata.json');
  
  let content = '';
  console.log('Fetching content... ');
  for await (const chunk of data) {
    content += chunk.toString('utf-8');
  }
  console.log('IPFS Content:', content);
}

createIPFSNode().then(() => {
  console.log("IPFS node created.");
  fetchIPFSContent(); 
});
*/


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
##################### uploadVideoToIPFS #######################
############################################################### 
*/
router.post('/uploadVideoToIpfs', async (ctx, next) => {
  if (ctx.request.path === '/uploadVideoToIpfs') {
    console.log("\n ####################################### \n '/uploadVideoToIpfs' " + new Date() + "\n ####################################### \n ");

    const taskId = ctx.request.body.tokenId;
    const winnerAddress = ctx.request.body.winnerAddress;
   
    try {
      const db = await connectToDatabase();
      var collection = db.collection('videos');
      const video = await collection.findOne({ 'taskId': taskId, 'senderAddress': winnerAddress });

      if (fs.existsSync(video.path)){
        try {
          // Retrieve video to be uploaded to IPFS
          const fileData = fs.readFileSync(video.path);
          console.log("Video found.")

          // Upload video to IPFS and pin it via Filebase
          const metadata = await filebaseClient.store({
            name: video.name,
            description: `A TaskSama winner video made by ${video.senderAddress}.`,
            image: new File([fileData], video.senderAddress, { type: 'video/mp4' }),
          });
          console.log("video succesfully uploaded to IPFS. metadata: ",metadata);

          // Insert the uploaded video information into the "IPFSvideos" collection
          const currentDate = new Date();
          const formattedDate = formatDateToString(currentDate);
          const videoData = {
            name: video.name,
            IPFSMetadataUrl: metadata.url,
            nftId: 'to be minted',
            winnerAddress: winnerAddress,
            uploadDate: formattedDate,
          };
          
          collection = db.collection('IPFSvideos');
          await collection.insertOne(videoData);
          console.log("doc inserted into IPFSvideos");

          ctx.body = {
            message: 'Video uploaded to IPFS successfully.',
            data: videoData,
          };
        } catch (error) {
          console.log(`Failed to retrieve video locally at path ${video.path}: ${error}`);
        }
      } else {
        ctx.throw(404, 'Video to be uploaded to IPFS not found locally.');
      }

    } catch (error) {
      ctx.throw(500, 'Failed to upload the video to IPFS.', error);
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

    try {
      const db = await connectToDatabase();
      const collection = db.collection('videos');
      const video = await collection.findOne({ 'taskId': tokenId, 'senderAddress': participantAddress });
      console.log("video.path", video.path);

      const filePath = video.path;

      if (fs.existsSync(filePath)) {
        // Create a readable stream from the file
        const fileStream = fs.createReadStream(filePath);

        // Set the response type to 'video/mp4'
        ctx.type = 'video/mp4';

        // Create a PassThrough stream to pass data to the response
        const passThroughStream = new PassThrough();

        // Pipe the file stream to the PassThrough stream
        fileStream.pipe(passThroughStream);

        // Set the response body to the PassThrough stream
        ctx.body = passThroughStream;
      } else {
        ctx.throw(404, 'Video not found');
      }
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
