// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ITasksSamaContract {
    function mintVideoNFT(address recipient, string calldata title, string calldata description, string calldata ipfsUrl, uint256 rewardEarned, address[] calldata participants) external returns (uint256);
}

contract Tasks is ERC721, Ownable {
    
    struct Task {
        uint256 tokenId;
        address owner;
        string title;
        string description;
        string imageURI;
        uint256 reward;
        address[] participants;
        address winner;
    }

    ITasksSamaContract private _taskSamaContract;
    Task[] public tasks;

    mapping(uint256 => bool) public taskExists;
    mapping(uint256 => bool) public taskCompleted;

    uint256 public minimumReward = 10 ether; // Minimum reward is 5 GLMR tokens //900

    event TaskCreated(uint256 indexed taskId, address owner, string title, string description, string imageURI, uint256 reward);
    event TaskCompleted(uint256 indexed taskId, address winner);

    constructor(address taskSamaContractAddress) ERC721("Tasks", "TASK") {
        _taskSamaContract = ITasksSamaContract(taskSamaContractAddress);
    }

    function createTask(string memory _title, string memory _description, string memory _imageURI) public payable {
        require(msg.value >= minimumReward, "Reward is too low");

        Task memory newTask = Task({
            tokenId: tasks.length,
            owner: msg.sender,
            title: _title,
            description: _description,
            imageURI: _imageURI,
            reward: msg.value,
            participants: new address[](0),
            winner: address(0)
        });

        tasks.push(newTask);

        _mint(msg.sender, newTask.tokenId);
        taskExists[newTask.tokenId] = true;

        emit TaskCreated(newTask.tokenId, msg.sender, _title, _description, _imageURI, msg.value);
    }

    function participate(uint256 _taskId) public {
        require(_taskExists(_taskId), "Task does not exist");
        require(!_isOwner(_taskId, msg.sender), "You cannot participate in your own task");
        require(!_isParticipant(_taskId, msg.sender), "Already participated");

        tasks[_taskId].participants.push(msg.sender);
    }

    function chooseWinner(uint256 _taskId, address payable _winner, string memory ipfsUrl) public {
        require(_taskExists(_taskId), "Task does not exist");
        require(!_isCompleted(_taskId), "Task is already completed");
        require(_isParticipant(_taskId, _winner), "The user chosen did not participate");
        require(_isOwner(_taskId, msg.sender), "Only the owner of the task can choose the winner");

        tasks[_taskId].winner = _winner;
        taskCompleted[_taskId] = true;

        //transfer the reward from the contract balance to the winner
        _winner.transfer(tasks[_taskId].reward * 1 wei); 
         //mints the video NFT
        _taskSamaContract.mintVideoNFT(_winner, msg.sender, tasks[_taskId].title, tasks[_taskId].description, ipfsUrl, tasks[_taskId].reward, tasks[_taskId].participants);

        emit TaskCompleted(_taskId, _winner);
    }

    function _isParticipant(uint256 _taskId, address _participant) public view returns (bool) {
        for (uint256 i = 0; i < tasks[_taskId].participants.length; i++) {
            if (tasks[_taskId].participants[i] == _participant) {
                return true;
            }
        }
        return false;
    }

    function _taskExists(uint256 _taskId) public view returns (bool) {
        return taskExists[_taskId];
    }

    function _isCompleted(uint256 _taskId) public view returns (bool) {
        return taskCompleted[_taskId];
    }

    function _isOwner(uint256 _taskId, address walletCheck) public view returns (bool) {
        return tasks[_taskId].owner == walletCheck;
    }

    function _getTasks() public view returns (Task[] memory) {
        return tasks;
    }

    function _getTask(uint256 _taskId) public view returns (Task memory) {
        return tasks[_taskId];
    }
    
    function _getParticipantsOf(uint256 _taskId) public view returns (address[] memory) {
        return tasks[_taskId].participants;
    }
    
    function _getWinnerOf(uint256 _taskId) public view returns (address) {
        require(!_isCompleted(_taskId), "This task doesn't have a winner yet");
        
        return tasks[_taskId].winner;
    }
}
