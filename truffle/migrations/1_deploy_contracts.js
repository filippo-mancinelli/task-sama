const Tasks = artifacts.require("Tasks");

module.exports = function(deployer) {
  deployer.deploy(Tasks);
};
