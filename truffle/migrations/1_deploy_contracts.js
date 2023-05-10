const Tasks = artifacts.require("Tasks");
const TaskSama = artifacts.require("TaskSama");

module.exports = async function(deployer) {
  deployer.deploy(TaskSama);
  const taskSamaContract = await TaskSama.deployed();

  await deployer.deploy(Tasks, taskSamaContract.address);
};
