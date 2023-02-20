pragma solidity ^0.8.0;

import "github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Counters.sol";

contract Tasks {
    using Counters for Counters.Counter;
    Counters.Counter public totalTasks;
    address public owner;

    struct Task {
        string description;
        uint256 rewardAmount;
        address ownerAddress;
        address[] submissions;
        address winner;
    }

    mapping (uint256 => Task) public tasks;

    constructor() {
        owner = msg.sender;
    }

    function createTask(string memory _description, uint256 _rewardAmount) public {
        tasks[totalTasks] = Task(_description, _rewardAmount, msg.sender, new address[](0), address(0));
        totalTasks.increment();
    }

    function submitTask(uint256 _taskId) public {
        tasks[_taskId].submissions.push(msg.sender);
    }

    function chooseWinner(uint256 _taskId, address _winner) public {
        require(msg.sender == tasks[_taskId].owner, "You cannot choose a winner of a task you don't own");
        tasks[_taskId].winner = _winner;
        payable(_winner).transfer(tasks[_taskId].rewardAmount);
    }
}
