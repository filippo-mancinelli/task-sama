// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TaskSama.sol";

contract Tasks {
    using Counters for Counters.Counter;
    Counters.Counter public totalTasks;

    TaskSama public nftContract;
    address public owner;

    struct Participant {
        bool participated;  //partecipa al task?
        bool submitted;  //ha inviato il video?
    }
    
    struct Task {
        string title;
        string description;
        uint256 rewardAmount;
        address ownerAddress;
        address winnerAddress;
        mapping(address => Participant) participants; //mapping to keep track of the addresses participating to the task
        address[] submissions;  //array to keep the chronological order of the submissions of participants
        bool status;  //true=open, false=closed
    }

    mapping (uint256 => Task) public tasks;

    event TaskCreated(uint256 indexed taskId, string title, string description, address indexed owner, uint256 rewardAmount, bool status);
    event ParticipantAdded(uint256 indexed taskId, address indexed participant);
    event ParticipantSubmittedVideo(uint256 indexed taskId, address indexed participant, string videoIPFShash);
    event WinnerChosen(uint256 indexed taskId, string title, string description, address indexed owner, uint256 rewardAmount, bool status);
    event NFTMinted(uint256 indexed taskId, address indexed winner, string tokenURI);

    constructor() {
        owner = msg.sender;
        nftContract = TaskSama("taskSama address here")
    }

    function createTask(string memory _title, string memory _description) public {
        totalTasks.increment();
        tasks[totalTasks.current()] = Task({
            title: _title,
            description: _description,
            rewardAmount: msg.value,
            ownerAddress: msg.sender,
            winnerAddress: address(0),
            submissions: new address[](0),
            status: true
        });
        emit TaskCreated(totalTasks.current(), _title, _description, msg.sender, msg.value, true);
    } 
    
    function addParticipant(uint256 _taskId) public {
        require(tasks[_taskId].participants[msg.sender].participated == false, "Participant already added");
        tasks[_taskId].participants[msg.sender] = Participant({
            participated: true,
            submitted: false
        });
        tasks[_taskId].submissions.push(msg.sender);
        emit ParticipantAdded(_taskId, msg.sender);
    }

    function chooseWinner(uint256 _taskId, address _winner, string memory tokenURI) public {
        require(tasks[_taskId].participants[_winner].participated == true, "Winner not a participant");
        require(msg.sender == tasks[_taskId].ownerAddress, "You can't choose a winner for a task you have not created");

        task = tasks[_taskId];
        task.winnerAddress = _winner;
        task.status = false;

        //mint the nft and give it to the TaskOwner
        nftContract.safeMint(msg.sender, tokenURI);
        emit WinnerChosen(_taskId, task.title, task.description, task.ownerAddress, _winner, task.rewardAmount);
        emit NFTMinted(_taskId, _winner, tokenURI);

        //pay the task winner
        payable(_winner).transfer(tasks[taskId].rewardAmount);
    }

    function fetchTasks() public view returns (Task[] memory) {
        Task[] memory taskIds = new Task[](totalTasks.current());
        for (uint256 i = 1; i <= totalTasks.current(); i++) {
            taskIds[i].push(tasks[i]);
        }
        return taskIds;
    }
}
