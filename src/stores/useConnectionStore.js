import { ethers } from 'ethers';
import { networkConfigs } from '../helpers/networks';
import { defineStore } from 'pinia'

export const useConnectionStore = defineStore('connection', {
    
    state: () => ({ 
        //provider: ((window.ethereum != null) ? new ethers.providers.Web3Provider(window.ethereum) : ethers.providers.getDefaultProvider());
        //provider: new ethers.providers.JsonRpcProvider('https://goerli.infura.io/v3/e595556a6f02441e809bc933758ab52a');  //Infura
        //provider: new ethers.providers.JsonRpcProvider('http://localhost:8545'),  //Ganache
        provider: null,
        signer: null,
        walletAddress: null,
        isConnected: false,
        contractABI: [ "JSONZ" ], //TODO remix/truffle
        contractAddress: "0x...", //TODO remix/truffle
        contractInstance: null
    }),

    getters: {
      getProvider: (state) => state.provider,
      getContractABI: (state) => state.contractABI,
      getContractAddress: (state) => state.contractAddress,
      getContractInstance: (state) => state.contractInstance,

      getIsConnected: (state) => {
        if(typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')){
            state.isConnected = true;
        } 
        return isConnected;
      },
    },

    actions: {
      async connect() { 
        if(!this.isConnected){
          await this.provider.send("eth_requestAccounts", []) 
        }
        console.log("provider",this.provider);
        console.log("signer",getSigner(this.provider));
        console.log("walletaddress",getWalletAddress(getSigner(provider)));
      },
      
      async getSigner(provider) {
        if(isConnected()) {
          this.signer = provider.getSigner();
        }
        console.log("signer", signer);
        return signer;
      },
    
      async getWalletAddress(signer) {
        let walletAddress;
        if(isConnected()){
          walletAddress = signer.getAddress().then((address) => {return address});
        }
        console.log("walletAddress", walletAddress);
        return walletAddress;
      }
    },
  })
  