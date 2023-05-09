import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { networkConfigs } from '../helpers/networks';
import { defineStore } from 'pinia'
import { watch } from 'vue';
import TasksABI from "../helpers/TasksABI.json";


export const useConnectionStore = defineStore('metamaskConnection', {

    state: () => ({ 
        provider: null,
        signer: null,
        walletAddress: null,
        isConnected: false,
        contractABI: TasksABI,
        contractAddress: "0x4Bf7250D7a9edeE52A9C2AE74534AC2cC4fF8E81", //ganache generated
        contractInstance: null,
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
            //console.log('isConnected changed:', newValue);
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
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            await this.setProvider();

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
          this.provider = new Web3Provider(window.ethereum);
        } else {
          //this.provider = new ethers.providers.JsonRpcProvider('https://goerli.infura.io/v3/e595556a6f02441e809bc933758ab52a');  //Infura
          //this.provider = ethers.getDefaultProvider('moonbeam'); //Default provider, moonbeam mainnet
          this.provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');  //ganache
        }
        
        if(this.provider != 'undefined') {
          //console.log("ABI",jsonParse(this.contractABI))
          this.contractInstance = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
        }
      },

      async setSigner() {
        if(this.isConnected) {
          this.signer = this.provider.getSigner();
        }
      },

      async setWalletAddress() {
        if(this.isConnected && this.signer != null){
          this.walletAddress = this.signer.getAddress().then((address) => {return address});
        }
      },

      async callContractFunction(functionName, params){
        const result = await this.contractInstance[functionName](...params);
        return result
      }
    },
  })

  function jsonParse(object) {
    return JSON.parse(JSON.stringify(object));
  }
  