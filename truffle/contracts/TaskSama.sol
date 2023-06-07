// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TaskSama is ERC721, Ownable {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Video {
        uint256 tokenId;
        string title;
        string description;
        string ipfsUrl;
        uint256 rewardEarned;
        address winner;
        address[] participants;
        uint256 timestamp;
    }

    Video[] public tasksama;

    constructor() ERC721("TaskSama", "TSK") { }

    function mintVideoNFT(address recipient, string memory title, string memory description, string memory ipfsUrl, uint256 rewardEarned, address[] memory participants) public returns (uint256) {
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();

        _safeMint(recipient, newTokenId);

        tasksama.push(Video({
            tokenId: newTokenId,
            title: title,
            description: description,
            ipfsUrl: ipfsUrl,
            rewardEarned: rewardEarned,
            winner: recipient,
            participants: participants,
            timestamp: block.timestamp // Set the current timestamp
        }));

        return newTokenId;
    }


    function getVideos() public view returns (Video[] memory) {
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
