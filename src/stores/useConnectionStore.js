import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { networkConfigs } from '../helpers/networks';
import { defineStore } from 'pinia'
import { watch } from 'vue';
import { onMounted } from 'vue';

export const useConnectionStore = defineStore('connection', {

    state: () => ({ 
        provider: null,
        signer: null,
        walletAddress: null,
        isConnected: false,
        contractABI: null, //fetch("../helpers/TasksABI.json").then(response => {return response}),
        contractAddress: "0xf8c41575cb56654c6098cd7fe3f36984c3b4b0c0", //ganache generated
        contractInstance: null,
    }),

    onMounted() {
      watch(
        () => this.contractABI.value, 
        (oldABI, newABI) => {
          console.log("contractABI old: ${oldABI} contractABI new: ${newABI}")
        }
      )
    },

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
        
        if(typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')){

          window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
              this.isConnected = true;
            } else {
              this.isConnected = false;
            }
          });        
        } 
      },

      async checkConnection() {
        if (typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          this.isConnected = accounts.length > 0;
          if (this.isConnected) {
            await this.setProvider();
            await this.setSigner();
            await this.setWalletAddress();
          }
        }
      },
      
      async connect() { 
        if(!this.isConnected){
          if(typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined')){
            await this.setProvider();
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            //at this point, initConnectionWatcher listener should have updated already isConnected
            if(this.isConnected){
              this.setSigner();
              this.setWalletAddress()    
            }
          }
        } 
      },
      
      //if the user is connected we use metamask as provider, else we use infura/ganache, and then create the contract istance 
      async setProvider() {
        if(this.isConnected) {
          provider = new Web3Provider(window.ethereum);
        } else {
          //provider = new ethers.providers.JsonRpcProvider('https://goerli.infura.io/v3/e595556a6f02441e809bc933758ab52a');  //Infura
          provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');  //Ganache
        }
        
        if(provider != 'undefined') {
          contractInstance = new ethers.Contract(contractAddress, TasksABI, provider);
          console.log("contractInstance",contractInstance)
        }
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
  