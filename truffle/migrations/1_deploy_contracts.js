const TaskSama = artifacts.require("TaskSama");
const Tasks = artifacts.require("Tasks");


module.exports = async function (deployer) {
  deployer.deploy(TaskSama).then(() => {
    // Get the deployed instance of FirstContract
    return TaskSama.deployed();
    
  }).then((TaskSamaInstance) => {
    // Deploy SecondContract and pass the address of FirstContract to its constructor
    return deployer.deploy(Tasks, TaskSamaInstance.address);
  });
};
