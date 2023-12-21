const { connectToDatabase } = require('../db');
const Router = require('@koa/router');
const router = new Router();
const multer = require('@koa/multer');
const upload = multer({ dest: "uploads/images" }); 
const fs = require('fs');
const Web3Token = require('web3-token');
require('dotenv').config();


/* 
###############################################################
####################### uploadImageToDB #######################
############################################################### 
*/
router.post('/uploadImageToDB', upload.single('file'), async (ctx, next) => {
  if (ctx.request.path === '/uploadImageToDB') {
    console.log("\n ####################################### \n '/uploadImageToDB' " + new Date() + "\n ####################################### \n ");
  
    const image = ctx.request.file; 
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

    //### Uploaded image checks ###//
    if (!image) {
      ctx.throw(400, 'No file uploaded.');
    }

    const allowedFileExtensions = ['jpeg', 'jpg', 'png'];
    const fileExtension = image.originalname.split('.').pop().toLowerCase();
    if (!allowedFileExtensions.includes(fileExtension)) {
      ctx.throw(400, 'Invalid file format. Only JPEG, JPG, and PNG are allowed.');
    }

    const maxFileSize = 2 * 1024 * 1024; // 2MB in bytes
    if (image.size > maxFileSize) {
      ctx.throw(400, 'File size exceeds the 2MB limit.');
    }
    //### Checks end ###//


    try {
      const dir = `./uploads/images/${taskId}/${walletAddress}`;
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
      }

      const tempFilePath = 'uploads/images/' + image.filename;
      const newFilePath = `uploads/images/${taskId}/${walletAddress}/` + image.originalname;
      fs.rename(tempFilePath, newFilePath, (err) => { 
        if (err) {
          console.error('Error renaming file:', err);
        } else {
          console.log('File renamed successfully.');
        }
      });

      const db = await connectToDatabase();
      const collection = db.collection('images');
      
      const currentDate = new Date();
      const formattedDate = formatDateToString(currentDate);

      // Insert the image information into the "images" collection
      const imageData = {
        name: image.originalname,
        path: newFilePath,
        uploadDate: formattedDate,
        size: image.size,
        taskId: taskId,
        senderAddress: walletAddress
      };

      await collection.insertOne(imageData);
      console.log("doc inserted:", imageData);

      ctx.body = {
        message: 'Image uploaded and saved successfully.',
        data: imageData,
      };
    } catch (error) {
      ctx.throw(500, 'Failed to upload and save the image.', error);
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
####################### fetchTaskImages #######################
############################################################### 
*/
router.get('/fetchTasksImages', async (ctx, next) => {
  if (ctx.request.path === '/fetchTasksImages') {
    console.log("\n ####################################### \n '/fetchTasksImages' " + new Date() + "\n ####################################### \n ");

    const db = await connectToDatabase();
    const collection = db.collection('images');

    try {
      const documents = await collection.find({}).toArray();
      const images = [];

      await documents.forEach((doc) => {
        const dir = doc.path;
        if (fs.existsSync(dir)){
          const imageBuffer = fs.readFileSync(dir);
          const base64Image = imageBuffer.toString('base64');
          
          images.push({
            taskId: doc.taskId,
            data: base64Image
          });

          // log task id and image name
          console.log(doc.taskId, doc.name);
        }
      });

      if(images.length === 0){
        ctx.body = {
          message: 'No images found.',
          data: images,
        };
      } else {
        ctx.body = {
          message: 'Images fetched correctly.',
          data: images,
        };
      }
    } catch (error) {
      ctx.throw(500, 'Failed to fetch images.', error);
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
####################### fetchTaskImage #########################
############################################################### 
*/
router.get('/fetchTaskImage', async (ctx, next) => {
  if (ctx.request.path === '/fetchTaskImage') {
    console.log("\n ####################################### \n '/fetchTaskImage/' " + new Date() + "\n ####################################### \n ");

    const taskId = ctx.request.query.taskId;
    const db = await connectToDatabase();
    const collection = db.collection('images');

    try {
      const documents = await collection.find({ taskId }).toArray();
      const images = [];

      await documents.forEach((doc) => {
        const dir = doc.path;
        if (fs.existsSync(dir)){
          const imageBuffer = fs.readFileSync(dir);
          const base64Image = imageBuffer.toString('base64');
          
          images.push({
            taskId: doc.taskId,
            data: base64Image
          });

          // log task id and image name
          console.log(doc.taskId, doc.name);
        }
      });
      if(images.length === 0){
        ctx.body = {
          message: 'No images found.',
          data: images,
        };
      } else {
        ctx.body = {
          message: 'Image fetched correctly.',
          data: images,
        };
      }

    } catch (error) {
      ctx.throw(500, 'Failed to fetch image.', error);
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
