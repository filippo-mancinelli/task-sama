const cron = require("node-cron");
const ethers = require("ethers");
const { tasksAddress, tasksamaAddress } = require('./contractAddresses');
const TasksABI = require("./helpers/TasksABI.json");
const TasksamaABI = require("./helpers/TasksamaABI.json");

const ganacheUrl = "http://localhost:8545";

async function fetchDataFromContract() {
  try {
    const provider = new ethers.JsonRpcProvider(ganacheUrl);
    console.log("provider",provider)
    const taskContract = new ethers.Contract(tasksAddress, TasksABI.abi, provider);
    const tasksamaContract = new ethers.Contract(tasksamaAddress, TasksamaABI.abi, provider);
    const result = await taskContract._getTasks();

    console.log("Fetched data:", result);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Schedule the job to run every 10 minutes
cron.schedule("*/10 * * * * *", () => {
    console.log("Fetching data from the smart contract...");
    fetchDataFromContract();
});
  
