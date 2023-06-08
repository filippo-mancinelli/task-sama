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
        tasksAddress: "0xCa28D9da0810bBcb8F11D0e6bf55fcC2c89E65e4", // ganache generated
        tasksamaAddress: "0x092E9D17642F3a0D32211F5265A80EF9ebC7f695", //ganache generated
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
      async initConnectionWatcher() {
        await this.setProvider(); //in any case we need a provider (ganache or infura)
        this.tasksInstance = markRaw(new ethers.Contract(this.tasksAddress, this.tasksABI, this.provider));
        this.tasksamaInstance = markRaw(new ethers.Contract(this.tasksamaAddress, this.tasksamaABI, this.provider));

        watch(
          () => this.isConnected,
          async (newValue) => {
            await this.setProvider();
            if(newValue == true) {
              await this.setSigner();
              await this.setWalletAddress();
            }
          });
        
        if(this.hasMetamask()){

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
        if (this.hasMetamask()) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          this.isConnected = accounts.length > 0;
          await this.setProvider();
          await this.setSigner();
          await this.setWalletAddress();  

          if (this.isConnected) return this.walletAddress;
        }
      },
      
      async connect() {
        if(!this.isConnected) {
          if(this.hasMetamask()){
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            await this.setProvider();
            await this.setSigner();
            await this.setWalletAddress();  
          }
        } 
      },

      hasMetamask() {
        return typeof window.ethereum !== 'undefined' || (typeof window.web3 !== 'undefined') ? true : false;
      },
      
      //if the user is connected we use metamask as provider, else we use infura/ganache, and then create the contract istance 
      async setProvider() {
        if(this.isConnected) {
          this.provider = markRaw(new Web3Provider(window.ethereum));
        } else {
          //this.provider = new ethers.providers.JsonRpcProvider('https://goerli.infura.io/v3/e595556a6f02441e809bc933758ab52a');  //Infura
          //this.provider = ethers.getDefaultProvider('moonbeam'); //Default provider, moonbeam mainnet
          this.provider = markRaw(new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545'));  //ganache
        }
      },

      async setSigner() {
        if(this.isConnected) {
          this.signer = this.provider.getSigner();
        }
      },

      async setWalletAddress() {
        if(this.isConnected && this.signer != null) {
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
      },

    },
  })

  function jsonParse(object) {
    return JSON.parse(JSON.stringify(object));
  }
  