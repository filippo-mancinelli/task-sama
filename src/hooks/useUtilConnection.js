import { ethers } from 'ethers';
import { networkConfigs } from '../helpers/networks';
import { useContext } from 'react';
import { EthereumContext } from '../App';

export const useUtilConnection = () => {
  //the provider instance must be defined in the App root component, in this way the same provider instance can be shared between all children components.
  const { provider, contractABI, contractNftABI, contractAddress, contractInstance } = useContext(EthereumContext);

  const isConnected = () => {
    if(typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')){
        let isConnected = true;
    } 
    return isConnected;
  }  

  const connect = async () => { 
    if(!isConnected()){
      await provider.send("eth_requestAccounts", []) 
    }
    console.log("provider",provider);
    console.log("signer",getSigner(provider));
    console.log("walletaddress",getWalletAddress(getSigner(provider)));
  }

  const disconnect = async (provider) => {
    if(isConnected()){
      provider.disconnect();
    }
  }

  async function getSigner(provider) {
    let signer;
    if(isConnected()) {
      signer = provider.getSigner();
    }
    console.log("signer", signer);
    return signer;
  }

  async function getWalletAddress(signer) {
    let walletAddress;
    if(isConnected()){
      walletAddress = signer.getAddress().then((address) => {return address});
    }
    console.log("walletAddress", walletAddress);
    return walletAddress;
  }

  async function getChainId(provider) {
    let network;
    if(isConnected()){
      network = await provider.getNetwork();
    }
    console.log("chainId", network.chainId);
    return network;
  }

  async function switchNetwork(chain) {
    if (provider.isConnected()) { 
      try {
        await provider.setNetwork(chain);
      } catch (error) {
        console.log("errore setNetwork: ",error);
      }
    } else {
        await provider.send("eth_requestAccounts", []);
    }
  }

  return { provider, contractABI, contractNftABI, contractAddress, contractInstance, isConnected, connect, disconnect, getSigner, getChainId, getWalletAddress, switchNetwork };
};
