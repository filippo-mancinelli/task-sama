// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TaskSama is ERC721, Ownable {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Video {
        string title;
        string description;
        string ipfsUrl;
        uint256 rewardEarned;
        address winner;
        address[] participants;
        uint256 timestamp;
    }

    mapping(uint256 => Video) private tasksama;

    constructor() ERC721("TaskSama", "TSK") { }

    function mintVideoNFT(address recipient, string memory title, string memory description, string memory ipfsUrl, uint256 rewardEarned, address[] memory participants) public returns (uint256) {
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();

        _mint(recipient, newTokenId);

        tasksama[newTokenId] = Video({
            title: title,
            description: description,
            ipfsUrl: ipfsUrl,
            rewardEarned: rewardEarned,
            winner: recipient,
            participants: participants,
            timestamp: block.timestamp // Set the current timestamp
        });

        return newTokenId;
    }

    
    function getVideos() public view returns (Video memory) {
        return tasksama;
    }

    function getVideo(uint256 tokenId) public view returns (Video memory) {
        require(_exists(tokenId), "Token ID does not exist");
        return tasksama[tokenId];
    }

    function getParticipants(uint256 tokenId) public view returns (Video memory) {
        require(_exists(tokenId), "Token ID does not exist");
        return tasksama[tokenId];
    }
}
