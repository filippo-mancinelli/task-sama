const TaskSama = artifacts.require("TaskSama");
const Tasks = artifacts.require("Tasks");

let tasksama, tasks;

module.exports = async function (deployer) {
  // Deploy TaskSama
  await deployer.deploy(TaskSama);
  tasksama = await TaskSama.deployed();

  // Deploy Tasks and pass the address of TaskSama to its constructor
  await deployer.deploy(Tasks, tasksama.address);
  tasks = await Tasks.deployed();

  // Initialize dummy data
  await tasks.createTask('TITLE 2', 'DESC 2', 'IPFS 2', { value: web3.utils.toWei("10", "ether") });
  await tasks.createTask('TITLE 3', 'DESC 3', 'IPFS 3', { value: web3.utils.toWei("15", "ether") });
  await tasks.createTask('TITLE 4', 'DESC 4', 'IPFS 4', { value: web3.utils.toWei("20", "ether") });
  await tasks.createTask('TITLE 5', 'DESC 5', 'IPFS 5', { value: web3.utils.toWei("25", "ether") });


  // participate to tasks with various accounts
  await tasks.participate(0)


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
const tasksama = await TaskSama.at("0x40B38908aF6312d3Ef6DAb3Ac3D16F01cfd27010");
const tasks = await Tasks.at("0x5B346a3899BF4cDCa810E6CDf341b0b57A421A25");
*/


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
