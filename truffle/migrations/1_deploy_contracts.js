const TaskMarketplace = artifacts.require("TaskMarketplace");
const TaskVideos = artifacts.require("TaskVideos");
const Tasks = artifacts.require("Tasks");

module.exports = function(deployer) {
  deployer.deploy(TaskMarketplace);
  deployer.deploy(TaskVideos);
  deployer.deploy(Tasks);
};
