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

};




/*
0x3B81545c92198D8C3fFBC8d36a2D6cfEbeaeB93C tasksama
0xcA637194F109032560983498e2c0ee11847a6f0f tasks
*/ 
