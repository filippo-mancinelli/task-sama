const TaskSama = artifacts.require("TaskSama");
const Tasks = artifacts.require("Tasks");

module.exports = async function (deployer) {
  // Give test funds to your metamask account
  const accounts = await web3.eth.getAccounts()
  const sender = accounts[9]
  const receiver = "0xA2385363b4e4B33d31bEB12FF1a350A9e37a6195"
  const amount = web3.utils.toWei("400", "ether")
  await web3.eth.sendTransaction({from: sender, to: receiver, value: amount})

  // Deploy TaskSama
  await deployer.deploy(TaskSama);
  const tasksama = await TaskSama.deployed();

  // Deploy Tasks and pass the address of TaskSama to its constructor
  await deployer.deploy(Tasks, tasksama.address);
  const tasks = await Tasks.deployed();

  // Initialize dummy data
  await tasks.createTask('TITLE 1', 'DESC 1', { value: web3.utils.toWei("10", "ether") });
  await tasks.createTask('TITLE 2', 'DESC 2', { value: web3.utils.toWei("12", "ether") });
  await tasks.createTask('TITLE 3', 'DESC 3', { value: web3.utils.toWei("15", "ether") });
  await tasks.createTask('TITLE 4', 'DESC 4', { value: web3.utils.toWei("20", "ether") });
  await tasks.createTask('TITLE 5', 'DESC 5', { value: web3.utils.toWei("25", "ether") });
  await tasks.createTask('TITLE 6', 'DESC 6', { value: web3.utils.toWei("21", "ether") });
  await tasks.createTask('TITLE 7', 'DESC 7', { value: web3.utils.toWei("300", "ether") });
  await tasks.createTask('TITLE 8', 'DESC 8', { value: web3.utils.toWei("120", "ether") });
  await tasks.createTask('TITLE 9', 'DESC 9', { value: web3.utils.toWei("19", "ether") });


  // participate to tasks with various accounts
  await tasks.participate(1, {from: accounts[9]});
  await tasks.participate(2, {from: accounts[1]});
  await tasks.participate(3, {from: accounts[2]});
  await tasks.participate(3, {from: accounts[3]});
  await tasks.participate(4, {from: accounts[3]});
  await tasks.participate(5, {from: accounts[4]});
  await tasks.participate(5, {from: accounts[5]});
  await tasks.participate(5, {from: accounts[6]});
  await tasks.participate(8, {from: accounts[8]});


  console.log("########### ACCOUNTS #############",accounts)
  
  // choose winners
  await tasks.chooseWinner(1, accounts[9], 'https://ipfs.io/ipfs/QmaFA62X2511yUy5ZSbaQuXY177U1SaTPguaKYHrUscL4H?filename=visore.mp4');
  await tasks.chooseWinner(2, accounts[1], 'https://ipfs.io/ipfs/QmRmTnWTRbKf1Cz5RRsmaib7wC3f3Yqo9JH7SG2YhxMW8k?filename=chimica.mp4');
  await tasks.chooseWinner(3, accounts[3], 'https://ipfs.io/ipfs/QmcjZ3HDDtxj17MYWGsUr6cuDnQFtzNq5RujEtK3GDLThT?filename=trama.mp4');
  await tasks.chooseWinner(5, accounts[6], 'https://ipfs.io/ipfs/QmcwD7k4N6K9LcyuWBb3LqNUJCC4nAHMivx9CSWNhbnWgY?filename=girl.mp4');
  
  // check 
  //console.log(await tasksama.getVideos())
  console.log(await tasks._getTasks())

  console.log("tasks: ", tasks.address)
  console.log("tasksama: ", tasksama.address)

};

/*
//contract instances
const tasksama = await TaskSama.at("0xFb802674358DE05573720Ea2fAFB1A8BF88bBb8e");
const tasks = await Tasks.at("0x501dBbc69Ef8EB7982e310C8f0E1Ff61b4E7F131");

//test send funds
const accounts = await web3.eth.getAccounts()
const sender = accounts[0]
const receiver = accounts[1]
const amount = web3.utils.toWei("200", "ether")
await web3.eth.sendTransaction({from: sender, to: receiver, value: amount})

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
