// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ITasksSamaContract {
    function mintVideoNFT(address recipient, address creator, string calldata title, string calldata description, string calldata ipfsUrl, uint256 rewardEarned, address[] calldata participants) external returns (uint256);
}

contract Tasks is ERC721, Ownable {
    struct Task {
        address owner;
        string title;
        string description;
        uint256 reward;
        address[] participants;
        address winner;
    }

    ITasksSamaContract private _taskSamaContract;
    mapping(uint256 => Task) public tasks;

    uint256 public taskCount;
    uint256 public minimumReward = 10 ether; // Minimum reward is 5 GLMR tokens //900

    event TaskCreated(uint256 indexed taskId, address owner, string title, string description, uint256 reward);
    event TaskCompleted(uint256 indexed taskId, address winner);

    constructor(address taskSamaContractAddress) ERC721("Tasks", "TASK") {
        _taskSamaContract = ITasksSamaContract(taskSamaContractAddress);
    }

    function createTask(string memory _title, string memory _description) public payable {
        require(msg.value >= minimumReward, "Reward is too low");

        uint256 tokenId = taskCount;
        Task memory newTask = Task({
            owner: msg.sender,
            title: _title,
            description: _description,
            reward: msg.value,
            participants: new address[](0),
            winner: address(0)
        });

        tasks[tokenId] = newTask;
        taskCount++;

        _mint(msg.sender, tokenId);

        emit TaskCreated(tokenId, msg.sender, _title, _description, msg.value);
    }

    function participate(uint256 _taskId) public {
        Task storage task = tasks[_taskId];
        require(_taskExists(_taskId), "Task does not exist");
        require(!_isOwner(task, msg.sender), "You cannot participate in your own task");
        require(!_isParticipant(task, msg.sender), "Already participated");

        task.participants.push(msg.sender);
    }

    function chooseWinner(uint256 _taskId, address payable _winner, string memory ipfsUrl) public {
        Task storage task = tasks[_taskId];
        require(_taskExists(_taskId), "Task does not exist");
        require(_isParticipant(task, _winner), "The user chosen did not participate");
        require(_isOwner(task, msg.sender), "Only the owner of the task can choose the winner");

        task.winner = _winner;

        //transfer the reward from the contract balance to the winner
        _winner.transfer(task.reward * 1 wei);

        //mints the video NFT
        _taskSamaContract.mintVideoNFT(_winner, msg.sender, task.title, task.description, ipfsUrl, task.reward, task.participants);

        emit TaskCompleted(_taskId, _winner);
    }

    function _isParticipant(Task storage task, address _participant) internal view returns (bool) {
        for (uint256 i = 0; i < task.participants.length; i++) {
            if (task.participants[i] == _participant) {
                return true;
            }
        }
        return false;
    }

    function _taskExists(uint256 _taskId) internal view returns (bool) {
        return _taskId < taskCount;
    }

    function _isOwner(Task storage task, address walletCheck) internal view returns (bool) {
        return task.owner == walletCheck;
    }

    function _getTasks() public view returns (Task[] memory) {
        Task[] memory allTasks = new Task[](taskCount);
        for (uint256 i = 0; i < taskCount; i++) {
            allTasks[i] = tasks[i];
        }
        return allTasks;
    }

    function _getTask(uint256 _taskId) public view returns (Task memory) {
        return tasks[_taskId];
    }

    function _getParticipantsOf(uint256 _taskId) public view returns (address[] memory) {
        return tasks[_taskId].participants;
    }
}
