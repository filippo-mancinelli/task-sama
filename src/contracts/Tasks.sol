pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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

    Task[] public tasks;

    mapping(uint256 => bool) public taskExists;
    mapping(uint256 => bool) public taskCompleted;

    uint256 public minimumReward = 5 * 10 ** 18; // Minimum reward is 5 GLMR tokens

    event TaskCreated(uint256 indexed taskId, address owner, string title, string description, string imageURI, uint256 reward);
    event TaskCompleted(uint256 indexed taskId, address winner);

    constructor() ERC721("Tasks", "TASK") {}

    function createTask(string memory _title, string memory _description, string memory _imageURI, uint256 _reward) public {
        require(_reward >= minimumReward, "Reward is too low");

        Task memory newTask = Task({
            tokenId: tasks.length,
            owner: msg.sender,
            title: _title,
            description: _description,
            imageURI: _imageURI,
            reward: _reward,
            participants: new address[](0),
            winner: address(0)
        });

        tasks.push(newTask);

        _mint(msg.sender, newTask.tokenId);
        taskExists[newTask.tokenId] = true;

        emit TaskCreated(newTask.tokenId, msg.sender, _title, _description, _imageURI, _reward);
    }

    function participate(uint256 _taskId) public {
        require(taskExists[_taskId], "Task does not exist");
        require(!_isParticipant(_taskId, msg.sender), "Already participated");

        tasks[_taskId].participants.push(msg.sender);
    }

    function chooseWinner(uint256 _taskId, address _winner) public onlyOwner {
        require(taskExists[_taskId], "Task does not exist");
        require(!_isCompleted(_taskId), "Task is already completed");
        require(_isParticipant(_taskId, _winner), "Winner did not participate");
        require(_isOwner(_taskId, msg.sender));

        tasks[_taskId].winner = _winner;
        taskCompleted[_taskId] = true;

        _transfer(address(this), _winner, _taskId);

        emit TaskCompleted(_taskId, _winner);
    }

    function _isParticipant(uint256 _taskId, address _participant) private view returns (bool) {
        for (uint256 i = 0; i < tasks[_taskId].participants.length; i++) {
            if (tasks[_taskId].participants[i] == _participant) {
                return true;
            }
        }
        return false;
    }

    function _isCompleted(uint256 _taskId) private view returns (bool) {
        return taskCompleted[_taskId];
    }

    function _isOwner(uint256 _taskId, address walletCheck) private view returns (bool) {
        return tasks[_taskId].owner == walletCheck;
    }
}
