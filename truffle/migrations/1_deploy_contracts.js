const TaskSama = artifacts.require("TaskSama");
const Tasks = artifacts.require("Tasks");

module.exports = async function (deployer) {
  // Deploy TaskSama
  await deployer.deploy(TaskSama);
  const tasksama = await TaskSama.deployed();

  // Deploy Tasks and pass the address of TaskSama to its constructor
  await deployer.deploy(Tasks, tasksama.address);
  const tasks = await Tasks.deployed();

  // Initialize dummy data
  await tasks.createTask('TITLE 1', 'DESC 1', 'IPFS 1', { value: web3.utils.toWei("10", "ether") });
  await tasks.createTask('TITLE 2', 'DESC 2', 'IPFS 2', { value: web3.utils.toWei("12", "ether") });
  await tasks.createTask('TITLE 3', 'DESC 3', 'IPFS 3', { value: web3.utils.toWei("15", "ether") });
  await tasks.createTask('TITLE 4', 'DESC 4', 'IPFS 4', { value: web3.utils.toWei("20", "ether") });
  await tasks.createTask('TITLE 5', 'DESC 5', 'IPFS 5', { value: web3.utils.toWei("25", "ether") });


  // participate to tasks with various accounts
  const accounts =  await web3.eth.getAccounts();
  await tasks.participate(1, {from: accounts[1]});
  await tasks.participate(2, {from: accounts[2]});
  await tasks.participate(2, {from: accounts[3]});
  await tasks.participate(3, {from: accounts[3]});
  await tasks.participate(4, {from: accounts[4]});


  // choose winners
  await tasks.chooseWinner(1, accounts[1], 'ipfsWIN');
  await tasks.chooseWinner(2, accounts[3], 'ipfsWIN');

  // listen to events emitted
  let options = {
    filter: {
        value: ['1000', '1337']    //Only get events where transfer value was 1000 or 1337
    },
    fromBlock: 'pending',                  //Number || "earliest" || "pending" || "latest"
    toBlock: 'latest'
  };
  tasks.getPastEvents('TaskCompleted', options)
  .then(res => {
    console.log("\n ####################################################################### \n " +
    "Winner chosen for task: %s is %s" +
    "\n ####################################################################### \n ",
     res[0].returnValues.taskId, res[0].returnValues.winner);
  })


  // check 
  await tasks._isCompleted(1);
  await tasks._isCompleted(2);

  await tasks._getTasks();


  /*
  //contract instances
  const tasksama = await TaskSama.at("0xF2D776AddACEe7D1f1ce52ce49d34BdF24200b94");
  const tasks = await Tasks.at("0xBCc8A9F8Ca5c41Ba2A16Bd2eD10CAA7171b93e13");
  */

  /* 
  //test send funds
  const accounts = await web3.eth.getAccounts()
  const sender = accounts[0]
  const receiver = accounts[1]
  const amount = web3.utils.toWei("200", "ether")
  await web3.eth.sendTransaction({from: sender, to: receiver, value: amount})
  */
};



/*
### Get the list of available accounts:
web3.eth.getAccounts().then(accounts => console.log(accounts))

### Check the balance of an account:
web3.eth.getBalance("0xYourAccountAddress").then(balance => console.log(web3.utils.fromWei(balance, 'ether') + " ETH"))

### Send Ether from one account to another:
web3.eth.sendTransaction({from: "0xSenderAccountAddress", to: "0xReceiverAccountAddress", value: web3.utils.toWei("1", "ether")})

### call read-only SC function**
const result = await contractInstance.myFunction.call({ from: accountToUse }) 

### call state-changing SC function**
const tx = await contractInstance.myFunction(param1, { from: accountToUse }) 



*/
