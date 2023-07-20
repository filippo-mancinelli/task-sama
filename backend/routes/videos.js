const { connectToDatabase } = require('../db');
const Router = require('@koa/router');
const router = new Router();
const multer = require('@koa/multer');
const upload = multer(); 
/* 
###############################################################
####################### uploadVideoToDB #######################
############################################################### 
*/
router.post('/uploadVideoToDB', upload.single('file'), async (ctx, next) => {
  if (ctx.request.path === '/uploadVideoToDB') {
    console.log("\n ####################################### \n '/uploadVideoToDB' \n ####################################### \n ");
    console.log("\n ####################################### \n", ctx.request.file, "\n ####################################### \n ");

    const video = ctx.request.file;  // Access the uploaded file like this since the video is sent as a formData object

    console.log("video",video)
    console.log("video.name",video.name)

    try {
      const filePath = './uploads/' + video.name;
      const currentDate = new Date();
      const formattedDate = formatDateToString(currentDate);

      await video.move(filePath);

      const db = await connectToDatabase();
      const collection = db.collection('videos');

      // Insert the video information into the "videos" collection
      const videoData = {
        name: video.name, // Use 'video.name' instead of 'video.fileName'
        path: filePath,
        uploadDate: formattedDate,
        size: video.size,
        tokenId: video.tokenId,
        likes: 0,
        likeWallets: [],
      };

      await collection.insertOne(videoData);

      ctx.body = {
        message: 'Video uploaded and saved successfully.',
        data: videoData,
      };
    } catch (error) {
      ctx.throw(500, 'Failed to upload and save the video.');
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
