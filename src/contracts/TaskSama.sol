// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TaskSama is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter public tokenCounter;

    uint256 public constant MAX_SUPPLY = 1000;
    address public minter;

    mapping (uint256 => address) public tokenOwner;
    mapping (uint256 => string) public tokenData;


    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
    }

    function safeMint(address recipient, string memory tokenURI) external {
        require(msg.sender == minter, "Only the minter can call this function");
        require(tokenCounter < MAX_SUPPLY, "All tokens have been minted");

        tokenCounter.increment();
        tokenData[totalSupply.current()] = tokenURI;
        tokenOwner[totalSupply.current()] = msg.sender;

        _safeMint(recipient, tokenCounter);
        _setTokenURI(tokenCounter, tokenURI);
    }

    function mint(address _nftOwner string memory _video) public {
        totalSupply.increment();
    }
}