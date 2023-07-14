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
        tasksAddress: "0x11d94f2558956359dB118310f75b393e435547B9", // ganache generated
        tasksamaAddress: "0x04B8af0a74a95C8266970788787b5DDe2bb5451d", //ganache generated
        tasksInstance: null,
        tasksamaInstance: null,
        isAllSetUp: false
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
            this.setAllSetUp()
          });
        
        if(this.hasMetamask()){

          window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
              this.isConnected = true;
            } else {
              this.isConnected = false;
              this.walletAddress = null;
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
          this.tasksInstance = markRaw(this.tasksInstance.connect(this.signer))
          this.tasksamaInstance = markRaw(this.tasksamaInstance.connect(this.signer))
        }
      },

      async setWalletAddress() {
        if(this.isConnected && this.signer != null) {
          this.walletAddress = await this.signer.getAddress();
        }
      },

      setAllSetUp() {
        if(
          this.isConnected == true &&
          (this.walletAddress !== null || this.walletAddress !== undefined) &&
          (this.signer !== null || this.signer !== undefined) &&
          (this.provider !== null || this.provider !== undefined) &&
          (this.tasksInstance !== null || this.tasksInstance !== undefined) &&
          (this.tasksamaInstance !== null || this.tasksamaInstance !== undefined)
        ) {
          this.isAllSetUp = true;
        } else {
          this.isAllSetUp = false;
        }
      },

      async callContractFunction(contractName, functionName, functionType, params, eth){         
        let result;
        if(contractName == "TaskSama") {
          if(functionType == "payable") result = await this.tasksamaInstance[functionName](...(params ? [...params] : []), { value: ethers.utils.parseEther(eth) });
          else result = await this.tasksamaInstance[functionName](...(params ? [...params] : []));
         
        } else if(contractName == "Tasks") {
          if(functionType=="payable") result = await this.tasksInstance[functionName](...(params ? [...params] : []), { value: ethers.utils.parseEther(eth) });
          else result = await this.tasksInstance[functionName](...(params ? [...params] : []));
        }
        return result
      },

    },
  })

  function jsonParse(object) {
    return JSON.parse(JSON.stringify(object));
  }
  