// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Counters.sol";
import "github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol";

contract TaskSama.sol {
    using Counters for Counters.Counter;
    Counters.Counter public totalSupply;
    mapping (uint256 => address) public tokenOwner;
    mapping (uint256 => string) public tokenData;

    address public owner;

    constructor() {
        owner = msg.sender;
        totalSupply = 0;
    }

    function mint(string memory _video) public {
        totalSupply++;
        tokenData[totalSupply] = _video;
        tokenOwner[totalSupply] = msg.sender;
    }
}