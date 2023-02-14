import { ethers } from 'ethers';
import { networkConfigs } from '../helpers/networks';

export const useUtilConnection = () => {

  //const provider = ((window.ethereum != null) ? new ethers.providers.Web3Provider(window.ethereum) : ethers.providers.getDefaultProvider());
  //const provider = new ethers.providers.JsonRpcProvider('https://goerli.infura.io/v3/e595556a6f02441e809bc933758ab52a');  //Infura
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');  //Ganache

  const contractABI = [ "JSONZ" ]; //TODO remix/truffle
  const contractAddress = "0x..."; //TODO remix/truffle
  const contractInstance = new ethers.Contract(contractAddress, contractABI, (isConnected(provider) ?  provider : null));

  const isConnected = () => {
    if(typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')){
        const isConnected = true;
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

  return { provider, contractABI, contractAddress, contractInstance, isConnected, connect, disconnect, getSigner, getChainId, getWalletAddress, switchNetwork };
};
