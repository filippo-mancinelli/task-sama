import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { networkConfigs } from '../helpers/networks';
import { defineStore } from 'pinia'
import { watch } from 'vue';

export const useConnectionStore = defineStore('connection', {
    
    state: () => ({ 
        provider: null,
        signer: null,
        walletAddress: null,
        isConnected: JSON.parse(localStorage.getItem('isConnected')),
        contractABI: [ "JSONZ" ], //TODO remix/truffle
        contractAddress: "0x...", //TODO remix/truffle
        contractInstance: null
    }),

    getters: {
      getProvider: (state) => state.provider,
      getContractABI: (state) => state.contractABI,
      getContractAddress: (state) => state.contractAddress,
      getContractInstance: (state) => state.contractInstance,
    },

    actions: {
      initConnectionWatcher() {
        watch(
          () => this.isConnected,
          (newValue) => {
            console.log('isConnected changed:', newValue);
          });
        
        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length > 0) {
            this.isConnected = true;
          } else {
            this.isConnected = false;
          }
        });
      },

      async connect() { 
        if(!this.isConnected){
          if(typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')){
            await this.setProvider();
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log("this.isConnected",this.isConnected);
            if(this.isConnected){
              this.setSigner();
              this.setWalletAddress()    
            }
          }
        } 
      },

      async setProvider() {
        this.provider = new Web3Provider(window.ethereum);
        //this.provider = new ethers.providers.JsonRpcProvider('https://goerli.infura.io/v3/e595556a6f02441e809bc933758ab52a');  //Infura
        //provider = new ethers.providers.JsonRpcProvider('http://localhost:8545'),  //Ganache

      },

      async setSigner() {
        if(this.isConnected) {
          this.signer = this.provider.getSigner();
        }
        console.log("signer", this.signer);
      },

      async setWalletAddress() {
        if(this.isConnected && this.signer != null){
          this.walletAddress = this.signer.getAddress().then((address) => {return address});
        }
        console.log("walletAddress", this.walletAddress);
      }
    },
  })
  