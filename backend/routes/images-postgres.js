const Router = require('@koa/router');
const router = new Router();
const multer = require('@koa/multer');
const upload = multer({ dest: "uploads/images" });
const fs = require('fs');
const { query } = require('../db-postgres');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
require('dotenv').config();

/* Verify Solana wallet signature */
function verifySolanaSignature(message, signature, publicKey) {
  try {
    const messageBytes = Buffer.from(message, 'utf8');
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(publicKey);

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/* Extract and verify auth token */
async function verifySolanaAuth(ctx) {
  const authToken = ctx.headers['authorization'];
  if (!authToken) ctx.throw(401, 'No authorization token');

  try {
    const [message, signature, publicKey] = authToken.split(':');
    if (!message || !signature || !publicKey) ctx.throw(401, 'Invalid token format');

    const isValid = verifySolanaSignature(message, signature, publicKey);
    if (!isValid) ctx.throw(401, 'Invalid signature');

    const timestamp = parseInt(message.split('Timestamp: ')[1]);
    if (Date.now() - timestamp > 5 * 60 * 1000) ctx.throw(401, 'Token expired');

    return publicKey;
  } catch (error) {
    ctx.throw(401, 'Invalid token', error);
  }
}

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
    const walletAddress = await verifySolanaAuth(ctx);

    //### Uploaded image checks ###//
    if (!image) {
      ctx.throw(400, 'No file uploaded.');
    }

    const allowedFileExtensions = ['jpeg', 'jpg', 'png'];
    const fileExtension = image.originalname.split('.').pop().toLowerCase();
    if (!allowedFileExtensions.includes(fileExtension)) {
      ctx.throw(400, 'Invalid file format. Only JPEG, JPG, and PNG are allowed.');
    }

    const maxFileSize = 2 * 1024 * 1024; // 2MB
    if (image.size > maxFileSize) {
      ctx.throw(400, 'File size exceeds the 2MB limit.');
    }
    //### Checks end ###//

    try {
      const dir = `./uploads/images/${taskId}/${walletAddress}`;
      if (!fs.existsSync(dir)) {
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

      // Check if user exists, if not create them
      const userCheck = await query(
        'SELECT wallet_address FROM users WHERE wallet_address = $1',
        [walletAddress]
      );

      if (userCheck.rows.length === 0) {
        // Create user if doesn't exist
        const sillyname = require('sillyname');
        const seed = Math.round(Math.random() * 10000000);
        const username = sillyname();

        await query(
          'INSERT INTO users (wallet_address, username, seed) VALUES ($1, $2, $3)',
          [walletAddress, username, seed]
        );
      }

      // Insert image record
      const result = await query(
        `INSERT INTO task_images (task_id, name, path, size, uploader_address)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [taskId, image.originalname, newFilePath, image.size, walletAddress]
      );

      console.log("Image record inserted:", result.rows[0]);

      ctx.body = {
        message: 'Image uploaded and saved successfully.',
        data: {
          id: result.rows[0].id,
          name: result.rows[0].name,
          taskId: result.rows[0].task_id,
          size: result.rows[0].size,
          uploadedAt: result.rows[0].uploaded_at
        },
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      ctx.throw(500, 'Failed to upload and save the image.', error);
    }
  }
  await next();
});

/*
###############################################################
####################### fetchTasksImages #######################
###############################################################
*/
router.get('/fetchTasksImages', async (ctx, next) => {
  if (ctx.request.path === '/fetchTasksImages') {
    console.log("\n ####################################### \n '/fetchTasksImages' " + new Date() + "\n ####################################### \n ");

    try {
      const result = await query(
        'SELECT task_id, path, name FROM task_images ORDER BY uploaded_at DESC'
      );

      const images = [];

      for (const row of result.rows) {
        const dir = row.path;
        if (fs.existsSync(dir)) {
          const imageBuffer = fs.readFileSync(dir);
          const base64Image = imageBuffer.toString('base64');

          images.push({
            taskId: row.task_id.toString(),
            data: base64Image
          });

          console.log(row.task_id, row.name);
        }
      }

      if (images.length === 0) {
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
      console.error('Error fetching images:', error);
      ctx.throw(500, 'Failed to fetch images.', error);
    }
  }
  await next();
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

    if (!taskId) {
      ctx.throw(400, 'Missing required parameter: taskId');
    }

    try {
      const result = await query(
        'SELECT task_id, path, name FROM task_images WHERE task_id = $1 ORDER BY uploaded_at DESC',
        [taskId]
      );

      const images = [];

      for (const row of result.rows) {
        const dir = row.path;
        if (fs.existsSync(dir)) {
          const imageBuffer = fs.readFileSync(dir);
          const base64Image = imageBuffer.toString('base64');

          images.push({
            taskId: row.task_id.toString(),
            data: base64Image
          });

          console.log(row.task_id, row.name);
        }
      }

      if (images.length === 0) {
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
      console.error('Error fetching image:', error);
      ctx.throw(500, 'Failed to fetch image.', error);
    }
  }
  await next();
});

module.exports = router;
