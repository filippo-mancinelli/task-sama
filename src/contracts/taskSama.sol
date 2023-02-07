pragma solidity ^0.8.0;

contract VideoNFT {
  // Define the NFT token structure
  struct Video {
    string ipfsHash;
  }

  // An array to store all the video NFTs
  Video[] public videos;

  // Mint a new NFT
  function mint(string memory _ipfsHash) public {
    videos.push(Video(_ipfsHash));
  }
}