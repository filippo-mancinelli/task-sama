import { ethers } from 'ethers';
import { networkConfigs } from '../helpers/networks';
import { useContext } from 'react';
import { EthereumContext } from '../App';

export const useUtilConnection = () => {
  //the provider instance must be defined in the App root component, in this way the same provider instance can be shared between all children components.
  const { provider, taskMarketplaceABI, taskVideosABI, tasksABI, taskMarketplaceContractInstance, taskVideosContractInstance, tasksContractInstance } = useContext(EthereumContext);

  const isConnected = async () => {
    let isConnected = false;
    //console.log(window.ethereum)
    if (!window.ethereum.isMetamask) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          isConnected = true;
          console.log("User is already connected.");
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      console.log("MetaMask is not installed.");
    }
    return isConnected;
  }  

  const connect = async () => { 
    if(!(await isConnected())){
      await window.ethereum.request({ method: "eth_requestAccounts" });
      console.log("provider",provider);
      console.log("signer",getSigner(provider));
      console.log("walletaddress",getWalletAddress(getSigner(provider)));
    }
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

  return { provider, taskMarketplaceABI, taskVideosABI, tasksABI, taskMarketplaceContractInstance, taskVideosContractInstance, tasksContractInstance, isConnected, connect, disconnect, getSigner, getChainId, getWalletAddress, switchNetwork };
};
