// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TaskVideos {
    using Counters for Counters.Counter;
    Counters.Counter public totalSupply;
    mapping (uint256 => address) public tokenOwner;
    mapping (uint256 => string) public tokenData;

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function mint(string memory _video) public {
        totalSupply.increment();
        tokenData[totalSupply.current()] = _video;
        tokenOwner[totalSupply.current()] = msg.sender;
    }
}