// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TaskMarketplace is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemsIds;
    Counters.Counter private _itemsSold;
    Counters.Counter public totalUploadedSupply;

    mapping (uint256 => address) public tokenOwner;
    mapping (uint256 => string) public tokenData;


    address public owner;

    constructor() {
        owner = msg.sender;
    }

    struct MarketItem {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
        string ipfsHash;
    }

    mapping(uint256 =>  MarketItem) private idToMarketItem;

    event MarketItemCreated (
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    event MarketItemSold (
        uint indexed itemId,
        address owner
    );

    function mint(string memory _ipfsHash) public {
        require(msg.sender == owner, "Only the owner of the marketplace can mint the NFT of this video");
        totalUploadedSupply.increment();
        tokenData[totalUploadedSupply.current()] = _ipfsHash;
        tokenOwner[totalUploadedSupply.current()] = msg.sender;
    }

    function createMarketItem(address nftContract, uint256 tokenId, uint256 price, string memory ipfsHash) public payable nonReentrant {
        require(price > 0, "Price must be greater than 0");

        _itemsIds.increment();
        uint256 itemId = _itemsIds.current();

        idToMarketItem[itemId] = MarketItem (
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),  //seller
            payable(address(0)), //owner, address(0) is a null contract with no balance or code
            price,
            false,
            ipfsHash
        );

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }

    function createMarketSale(address nftContract, uint256 itemId) public payable nonReentrant {
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;
        bool sold = idToMarketItem[itemId].sold;

        require(msg.value == price, "Please submit the asking price in order to complete the purchase");
        require(sold != true, "This sale has already finished");

        emit MarketItemSold(itemId, msg.sender);

        //idToMarketItem[itemId].seller = seller address
        //msg.sender = buyer address
        idToMarketItem[itemId].seller.transfer(msg.value);  //the 'seller' is receiving the ethers (msg.value), from the contract call (buyer).
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId); //this transfers the ownership from the taskMarketplace contract to the buyer
        _itemsSold.increment();
        idToMarketItem[itemId].sold = true;
    }

    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint itemCount = _itemsIds.current();
        uint unsoldItemCount = _itemsIds.current() - _itemsSold.current();
        uint currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        for (uint i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].owner == address(0)) {
                uint currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

}