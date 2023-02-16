import { useEffect, useState } from "react";
import { useIPFS } from "./useIPFS";
import { useUtilConnection } from "./useUtilConnection";

export const useNFTBalance = (options) => {
  const { provider, contractNftABI, getChainId, getSigner, getWalletAddress } = useUtilConnection();
  const account = getWalletAddress(getSigner(provider));
  const chainId = getChainId(provider);
  const { resolveLink } = useIPFS();
  const [NFTBalance, setNFTBalance] = useState([]);
  const [fetchSuccess, setFetchSuccess] = useState(true);
  setNFTBalance(getOwnedNFTs(account));  //array of NFTs

  useEffect(async () => {
    if (NFTBalance != null) {
      setFetchSuccess(true);
      for (let NFT of NFTBalance) {
        if (NFT?.metadata) {
          NFT.metadata = JSON.parse(NFT.metadata);
          NFT.image = resolveLink(NFT.metadata?.image);
        } else if (NFT?.token_uri) {
          try {
            await fetch(NFT.token_uri)
              .then((response) => response.json())
              .then((data) => {
                NFT.image = resolveLink(data.image);
              });
          } catch (error) {
            setFetchSuccess(false);

/*          !!Temporary work around to avoid CORS issues when retrieving NFT images!!
            Create a proxy server as per https://dev.to/terieyenike/how-to-create-a-proxy-server-on-heroku-5b5c
            Replace <your url here> with your proxy server_url below
            Remove comments :)
              try {
                await fetch(`<your url here>/${NFT.token_uri}`)
                .then(response => response.json())
                .then(data => {
                  NFT.image = resolveLink(data.image);
                });
              } catch (error) {
                setFetchSuccess(false);
              }
 */
          }
        }
      }
      setNFTBalance(NFTs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);


  async function getOwnedNFTs(tokenAddress, address) {
    const nftContract = new ethers.Contract(tokenAddress, contractNftABI, provider);
    const balance = await nftContract.balanceOf(address);
    const tokens = [];
  
    for (let i = 0; i < balance; i++) {
      const token = await nftContract.tokenOfOwnerByIndex(account, i);
      tokens.push(token);
    }
  
    return tokens;
  }
  

  return { getNFTBalance, NFTBalance, fetchSuccess, error, isLoading };
};