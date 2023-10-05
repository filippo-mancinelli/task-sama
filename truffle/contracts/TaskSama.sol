// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TaskSama is ERC721, ERC721URIStorage, Ownable {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Video {
        uint256 tokenId;
        string title;
        string description;
        uint256 rewardEarned;
        address creator;
        address winner;
        address[] participants;
        uint256 timestamp;
    }

    Video[] public tasksama;

    constructor() ERC721("TaskSama", "TSK") { }

    function _baseURI() internal pure override returns (string memory) {
        return "https://ipfs.io/";
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    

    function mintVideoNFT(address winner, address creator, string memory title, string memory description, string memory ipfsUrl, uint256 rewardEarned, address[] memory participants) public returns (uint256) {
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();

        _safeMint(creator, newTokenId);
        _setTokenURI(newTokenId, ipfsUrl);

        tasksama.push(Video({
            tokenId: newTokenId,
            title: title,
            description: description,
            rewardEarned: rewardEarned,
            creator: creator,
            winner: winner,
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
        
    function getWinnerOf(uint256 _taskId) public view returns (address) {
        return tasksama[_taskId].winner;
    }
}
