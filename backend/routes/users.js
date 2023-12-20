const { connectToDatabase } = require('../db');
const Router = require('@koa/router');
const router = new Router();
const { ObjectId } = require('mongodb');
const Web3Token = require('web3-token');
const sillyname = require('sillyname');
require('dotenv').config();

/* 
###############################################################
######################### getUsers ############################
############################################################### 
*/
router.get('/getUsers', async (ctx, next) => {
  if (ctx.request.path === '/getUsers') {
    console.log("\n ####################################### \n '/getUsers' " + new Date() + "\n ####################################### \n ");

    try {
      const db = await connectToDatabase();
      const collection = db.collection('users');

      const documents = await collection.find().toArray();
      ctx.body = {
        message: 'Users fetched correctly.',
        data: documents,
      };
    } catch (error) {
      ctx.throw(500, 'Failed to fetch users.', error);
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
####################### getUserData ###########################
############################################################### 
*/
router.get('/getUserData', async (ctx, next) => {
  if (ctx.request.path === '/getUserData') {
    console.log("\n ####################################### \n '/getUserData' " + new Date() + "\n ####################################### \n ");

    // getting token from authorization header 
    const authToken = ctx.headers['authorization'];
    var walletAddress;
    try {
      const { address, body } = await Web3Token.verify(authToken);
      walletAddress = address;
    }catch (error) {
      console.log("Invalid token: ", error)
      ctx.throw(401, 'Invalid token: ', error);
    }

    try {
      const db = await connectToDatabase();
      const collection = db.collection('users');
  
      const document = await collection.findOne({address: walletAddress })
      if(document){
        ctx.body = {
          message: 'User fetched correctly.',
          data: document,
        };
        console.log("User fetched correctly.", document);
      } else {
        ctx.throw(404, 'User not found.');
        console.log("User not found.");
      }

    } catch (error) {
      ctx.throw(500, 'Failed to fetch user.', error);
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
################### getUserDataByUsername #####################
############################################################### 
*/
router.get('/getUserDataByUsername', async (ctx, next) => {
  if (ctx.request.path === '/getUserDataByUsername') {
    console.log("\n ####################################### \n '/getUserDataByUsername' " + new Date() + "\n ####################################### \n ");

    const username = ctx.request.query.username;
    
    try {
      const db = await connectToDatabase();
      const collection = db.collection('users');
  
      const document = await collection.findOne({username: username })
      if(document){
        ctx.body = {
          message: 'User fetched correctly.',
          data: document,
        };
        console.log("User fetched correctly.", document);
      } else {
        ctx.throw(404, 'User not found.');
        console.log("User not found.");
      }

    } catch (error) {
      ctx.throw(500, 'Failed to fetch user.', error);
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
########################## verifyUser #########################
############################################################### 
*/
router.post('/verifyUser', async (ctx, next) => {
  if (ctx.request.path === '/verifyUser') {
    console.log("\n ####################################### \n '/verifyUser' " + new Date() + "\n ####################################### \n ");
  
    const seed = Math.round(Math.random() * 10000000); //Random seed
    const username = sillyname(); //Random username
    const authToken = ctx.headers['authorization'];
    var walletAddress;
    try {
      const { address, body } = await Web3Token.verify(authToken);
      walletAddress = address;
    }catch (error) {
      console.log("Invalid token: ", error)
      ctx.throw(401, 'Invalid token: ', error);
    }

    const db = await connectToDatabase();
    const collection = db.collection('users');

    // check if user exists. If not, create it
    const document = await collection.findOne({address: walletAddress });
    if(document){
      ctx.body = {
        message: 'User verified correctly.',
        data: document,
      };
      console.log("User verified correctly.", document);
    } else {
      const document = await collection.insertOne({
        address: walletAddress,
        username: username,
        seed: seed,
        creationDate: formatDateToString(new Date())
      });
      if(document){
        ctx.body = {
          message: 'User created correctly.',
          data: document,
        };
        console.log("User created correctly.", document);
      } else {
        ctx.throw(500, 'Failed to create user.');
        console.log("Failed to create user.");
      }
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
######################## editUsername #########################
############################################################### 
*/
router.post('/editUsername', async (ctx, next) => {
  if (ctx.request.path === '/editUsername') {
    console.log("\n ####################################### \n '/editUsername' " + new Date() + "\n ####################################### \n ");
  
    const username = ctx.request.body.username;
    const authToken = ctx.headers['authorization'];
    var walletAddress;
    try {
      const { address, body } = await Web3Token.verify(authToken);
      walletAddress = address;
    }catch (error) {
      console.log("Invalid token: ", error)
      ctx.throw(401, 'Invalid token: ', error);
    }

    if(username.length < 2 || username.length > 25){
      ctx.throw(400, 'Username must be between 2 and 25 characters long.');
      console.log("Username must be between 2 and 25 characters long.");
    }  

    const db = await connectToDatabase();
    const collection = db.collection('users');

    // Check if username is already taken
    const document = await collection.findOne({username: username });
    if(document){
      ctx.throw(400, 'Username already taken.');
      console.log("Username already taken.");
    }

    // Proceed to update username
    const updateResult = await collection.updateOne({address: walletAddress }, { $set: { username: username } });
    
    if(updateResult.modifiedCount === 1){
      const document = await collection.findOne({address: walletAddress });

      ctx.body = {
        message: 'Username updated correctly.',
        data: document.username,
      };
      console.log("Username updated correctly.", updateResult);
    } else {
      ctx.throw(500, 'Failed to update username.');
      console.log("Failed to update username.");
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

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

module.exports = router;
