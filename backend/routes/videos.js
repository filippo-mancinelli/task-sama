const { connectToDatabase } = require('../db');
const Router = require('@koa/router');
const router = new Router();
const multer = require('@koa/multer');
const upload = multer({ dest: "uploads/videos" }); 
const fs = require('fs');
const { PassThrough } = require('stream'); 
const { FilebaseClient, File } = require('@filebase/client');
const filebaseClient = new FilebaseClient({ token: process.env.FILEBASE_API_TOKEN });
const Web3Token = require('web3-token');
require('dotenv').config();

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
    const authToken = ctx.headers['authorization'];
    var walletAddress;
    try {
      const { address, body } = await Web3Token.verify(authToken);
      walletAddress = address;
    }catch (error) {
      console.log("Invalid token: ", error)
      ctx.throw(401, 'Invalid token: ', error);
    }
   
    //#### video checks ####//
    if (!video) {
      ctx.throw(400, 'No file uploaded.');
    }
    const allowedVideoFormats = ['video/mp4', 'video/webm'];
    if (!allowedVideoFormats.includes(video.mimetype)) {
      ctx.throw(400, 'Invalid video format. Only MP4 and WebM formats are allowed.');
    }
    const maxVideoSize = 15 * 1024 * 1024;
    if (video.size > maxVideoSize) {
      ctx.throw(400, 'Video size exceeds the 15MB limit.');
    }
    //#### checks end ####//

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
        senderAddress: walletAddress,
        moderated: 'null'  // null means that the video is not moderated yet
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

          // Retrieve from the ipfsMetadataUrl, the video's ipfsUrl, so we can store it and retrieve it easily from IPFSvideos collection
          const cloudflareURL = 'https://cloudflare-ipfs.com/';
          const ipfsioURL = 'https://ipfs.io/';

          let formattedMetadataURL = cloudflareURL + metadata.url.replace('ipfs://', 'ipfs/');
          let IPFSVideoUrl;
          
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
          
            const checkAvailability = await fetch(formattedMetadataURL, { method: 'HEAD', signal: controller.signal });
            clearTimeout(timeoutId); // Clear the timeout since the request completed within the time limit
          
            if (!checkAvailability.ok) {
              // Cloudflare IPFS gateway is unreachable, switch to ipfs.io
              formattedMetadataURL = ipfsioURL + metadata.url.replace('ipfs://', 'ipfs/');
            }
          
            const fetchResult = await fetch(formattedMetadataURL);
            const jsonResult = await fetchResult.json();
            IPFSVideoUrl = jsonResult.image;
          } catch (error) {
            console.error('Error occurred:', error);
            ctx.throw(500, 'Failed to retrieve video metadata.', error);
          }
          
          
          // Insert the uploaded video information into the "IPFSvideos" collection
          const currentDate = new Date();
          const formattedDate = formatDateToString(currentDate);
          const videoMetadata = {
            name: video.name,
            IPFSMetadataUrl: metadata.url.replace('ipfs://', 'ipfs/'),
            IPFSVideoUrl: IPFSVideoUrl.replace('ipfs://', 'ipfs/'),
            winnerAddress: winnerAddress,
            uploadDate: formattedDate,
            nftId: 'to be minted'
          };

          collection = db.collection('IPFSvideos');
          await collection.insertOne(videoMetadata);
          console.log("doc inserted into IPFSvideos");


          ctx.body = {
            message: 'Video uploaded to IPFS successfully.',
            data: videoMetadata,
          };
        } catch (error) {
          console.log(`${error}`);
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
##############################################################
####################### confirmNFTId #########################
############################################################## 
*/
router.post('/confirmNFTId', async (ctx, next) => {
  if (ctx.request.path === '/confirmNFTId') {
    console.log("\n ####################################### \n '/confirmNFTId' " + new Date() + "\n ####################################### \n ");

    const IPFSMetadataUrl = ctx.request.body.IPFSMetadataUrl;
    const tokenId = ctx.request.body.tokenId;
   
    try {
      const db = await connectToDatabase();
      var collection = db.collection('IPFSVideos');
      const updateResult = await collection.updateOne(
        { 'IPFSMetadataUrl': IPFSMetadataUrl },
        { $set: { nftId: tokenId} }
      );

    } catch (error) {
      ctx.throw(500, 'Failed to update IPFSVideos document.', error);
    }
  }
  await next();

  if (ctx.status === 404) {
    ctx.body = {
      message: 'Not found',
    };
  }
});

/* This blocks non moderated videos.
###############################################################
################### getParticipantVideo ######################
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
      if(video.moderated == 'true') {
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
      } else if(video.moderated == 'false'){
        ctx.throw(204, 'rejected');
      } else if(video.moderated == 'null'){
        ctx.throw(202, 'unmoderated');
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

/* This does NOT block non moderated videos and should be restricted only to moderators and admins. 
###############################################################
################# getParticipantVideoADMIN ####################
############################################################### 
*/
router.get('/getParticipantVideoADMIN', async (ctx, next) => {
  if (ctx.request.path === '/getParticipantVideoADMIN') { 
    console.log("\n ####################################### \n '/getParticipantVideoADMIN' \n ####################################### \n ");

    const participantAddress = ctx.request.query.participantAddress;
    const tokenId = ctx.request.query.tokenId;
    console.log("participantAddress: ",participantAddress);
    console.log("tokenId: ",tokenId);
    try {
      const db = await connectToDatabase();
      const collection = db.collection('videos');
      const video = await collection.findOne({ 'taskId': tokenId, 'senderAddress': participantAddress });
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
################ getUnmoderatedParticipants ###################
############################################################### 
*/
router.get('/getUnmoderatedParticipants', async (ctx, next) => {
  if (ctx.request.path === '/getUnmoderatedParticipants') {
    console.log("\n ####################################### \n '/getUnmoderatedParticipants' " + new Date() + "\n ####################################### \n ");

    const taskId = ctx.request.query.taskId;
    console.log("taskId", taskId);

    let unmoderatedParticipants;
    try {
      const db = await connectToDatabase();
      const collection = db.collection('videos');

      unmoderatedVideos = await collection.find({
        taskId,
        moderated: 'null',
      }).toArray();

      unmoderatedParticipants = unmoderatedVideos.map(video => video.senderAddress);
      console.log("unmoderatedParticipants", unmoderatedParticipants);

    } catch (error) {
      console.error("Error fetching unmoderated participants from db():", error)
    }

    ctx.body = {
      message: 'list of unmoderated participants',
      data: unmoderatedParticipants,
    };
  }
  await next();
});


/* 
###############################################################
###################### MODERATEVIDEO ##########################
############################################################### 
*/
router.post('/moderateVideo', async (ctx, next) => {
  if (ctx.request.path === '/moderateVideo') {
    console.log("\n ####################################### \n '/moderateVideo' " + new Date() + "\n ####################################### \n ");

    const taskId = ctx.request.body.taskId;
    const senderAddress = ctx.request.body.senderAddress;
    const moderated = ctx.request.body.moderated;
   
    try {
      const db = await connectToDatabase();
      var collection = db.collection('videos');
      const result = await collection.updateOne(
        { 'taskId': taskId, 'senderAddress': senderAddress },
        { $set: { moderated: moderated} } 
      );
      if(result.modifiedCount == 1) {
        ctx.body = {
          message: 'Video moderated successfully.',
        };
      } 

    } catch (error) {
      ctx.throw(500, 'Failed to moderate video:', error);
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
