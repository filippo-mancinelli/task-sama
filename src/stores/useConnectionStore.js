import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { networkConfigs } from '../helpers/networks';
import { defineStore } from 'pinia'
import { watch, markRaw  } from 'vue';
import TasksABI from "../helpers/TasksABI.json";
import TasksamaABI from "../helpers/TasksamaABI.json";


export const useConnectionStore = defineStore('metamaskConnection', {

    state: () => ({ 
        provider: null,
        signer: null,
        walletAddress: null,
        isConnected: false,
        tasksABI: TasksABI,
        tasksamaABI: TasksamaABI,
        tasksAddress: "0x31590FFB91E2ad3C297EA056626113dc0a399766", // ganache generated
        tasksamaAddress: "0x5FA522CFcEBB03E7163C88927D6daeF2bdd06E82", //ganache generated
        tasksInstance: null,
        tasksamaInstance: null,
    }),

    getters: {
      getProvider: (state) => state.provider,
      getContractABI: (state) => state.contractABI,
      getTasksAddress: (state) => state.tasksAddress,
      getTasksamaAddress: (state) => state.tasksamaAddress,
      getTasksInstance: (state) => state.tasksInstance,
      getTasksamaInstance: (state) => state.tasksInstance,
      getWalletAddress: (state) => state.walletAddress
    },
  
    actions: {
      initConnectionWatcher() {
        watch(
          () => this.isConnected,
          (newValue) => {
            if(newValue == true) {
              this.setProvider();
              this.setSigner();
              this.setWalletAddress();
            }
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
          await this.setProvider(); //in any case we need a provider (ganache or infura)

          if (this.isConnected) {
            await this.setSigner();
            await this.setWalletAddress();
            return this.walletAddress;
          }
          
          this.tasksInstance = new ethers.Contract(this.tasksAddress, this.tasksABI, this.provider);
          this.tasksamaInstance = new ethers.Contract(this.tasksamaAddress, this.tasksamaABI, this.provider);
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
          this.provider = markRaw(new Web3Provider(window.ethereum));
        } else {
          //this.provider = markRaw(new ethers.providers.JsonRpcProvider('https://goerli.infura.io/v3/e595556a6f02441e809bc933758ab52a'));  //Infura
          //this.provider = markRaw(ethers.getDefaultProvider('moonbeam')); //Default provider, moonbeam mainnet
          this.provider = markRaw(new ethers.providers.JsonRpcProvider('http://localhost:8545'));  //ganache
        }
      },

      async setSigner() {
        if(this.isConnected) {
          this.signer = markRaw(this.provider.getSigner());
        }
      },

      async setWalletAddress() {
        if(this.isConnected && this.signer != null){
          this.walletAddress = await this.signer.getAddress();
        }
      },

      async callContractFunction(contractName, functionName, params){ 
        let result;
        if(contractName == "TaskSama") {
          result = await this.tasksamaInstance[functionName](...(params || []));
        } else if(contractName == "Tasks") {
          result = await this.tasksInstance[functionName](...(params || []));
        }
        return result
      }
    },
  })

  function jsonParse(object) {
    return JSON.parse(JSON.stringify(object));
  }
  