// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface ITasksSamaContract {
    function mintVideoNFT(address winner, address creator, string calldata title, string calldata description, string calldata ipfsUrl, uint256 rewardEarned, address[] calldata participants) external returns (uint256);
}

contract Tasks is ERC721, Ownable {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Task {
        uint256 tokenId;
        address owner;
        string title;
        string description;
        uint256 reward;
        address[] participants;
        address winner;
    }

    ITasksSamaContract private _taskSamaContract;
    mapping(uint256 => Task) public tasks;

    uint256 public minimumReward = 10 ether; // Minimum reward is 5 GLMR tokens //900

    event TaskCreated(uint256 indexed taskId, address owner, string title, string description, uint256 reward);
    event TaskCompleted(uint256 indexed taskId, address winner);

    constructor(address taskSamaContractAddress) ERC721("Tasks", "TASK") {
        _taskSamaContract = ITasksSamaContract(taskSamaContractAddress);
    }

    function createTask(string memory _title, string memory _description) public payable {
        require(msg.value >= minimumReward, "Reward is too low");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        Task memory newTask = Task({
            tokenId: tokenId,
            owner: msg.sender,
            title: _title,
            description: _description,
            reward: msg.value,
            participants: new address[](0),
            winner: address(0)
        });

        tasks[tokenId] = newTask;
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

        // Transfer the reward from the contract balance to the winner
        _winner.transfer(task.reward * 1 wei);

        // Mints the video NFT
        _taskSamaContract.mintVideoNFT(_winner, msg.sender, task.title, task.description, ipfsUrl, task.reward, task.participants);

        // Delete the task from the mapping
        delete tasks[_taskId];

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

    // Since "tasks" is a mapping, every possible keys already exists, therefore we can make use of its defaults values to check if a given key has initialized values to see if it exists or not.
    function _taskExists(uint256 _taskId) public view returns (bool) {
        bool result = (tasks[_taskId].tokenId != 0 && tasks[_taskId].reward != 0) ? true : false;  
        return result;
    }

    function _isOwner(Task storage task, address walletCheck) internal view returns (bool) {
        return task.owner == walletCheck;
    }

    function _getTasks() public view returns (Task[] memory) {
        Task[] memory allTasks = new Task[](_tokenIdCounter.current());
    
        uint256 validTaskCount = 0;
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (_taskExists(i)) {
                allTasks[validTaskCount] = tasks[i];
                validTaskCount++;
            }
        }
    
        // Resize the array to remove any uninitialized elements
        assembly {
            mstore(allTasks, validTaskCount)
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
