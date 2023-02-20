pragma solidity ^0.8.0;

contract Tasks {
    address public owner;

    struct Task {
        string description;
        uint256 rewardAmount;
        address ownerAddress;
        address[] submissions;
        address winner;
    }

    mapping (uint256 => Task) public tasks;
    uint256 public totalTasks;

    constructor() {
        owner = msg.sender;
    }

    function createTask(string memory _description, uint256 _rewardAmount) public {
        tasks[totalTasks] = Task(_description, _rewardAmount, msg.sender, new address[](0), address(0));
        totalTasks++;
    }

    function submitTask(uint256 _taskId) public {
        tasks[_taskId].submissions.push(msg.sender);
    }

    function chooseWinner(uint256 _taskId, address _winner) public {
        tasks[_taskId].winner = _winner;
        payable(_winner).transfer(tasks[_taskId].rewardAmount);
    }
}
