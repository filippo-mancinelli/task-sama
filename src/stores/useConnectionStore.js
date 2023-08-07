import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { networkConfigs } from '../helpers/networks';
import { defineStore } from 'pinia'
import { watch, markRaw  } from 'vue';
import TasksABI from "../helpers/TasksABI.json";
import TasksamaABI from "../helpers/TasksamaABI.json";
import jazzicon from "@metamask/jazzicon"

export const useConnectionStore = defineStore('metamaskConnection', {

    state: () => ({ 
        provider: null,
        signer: null,
        walletAddress: null,
        isConnected: false,
        tasksABI: TasksABI,
        tasksamaABI: TasksamaABI,
        tasksAddress: "0xdcd79D879bddf7E89c281F55360922592e90d968", // ganache generated
        tasksamaAddress: "0xA3BF57BA2e76A8D133c8a60F95bcC7edC9b886Cf", //ganache generated
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

      async disconnect() {
        if (this.isConnected) {
          if (this.hasMetamask()) {
            this.isConnected = false;
            this.walletAddress = null;
            await this.setProvider();
            await this.setSigner();
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
        //either way we need to update the contracts instances because they use the provider
        await this.setContractInstances();
      },

      async setContractInstances() {
        this.tasksInstance = markRaw(new ethers.Contract(this.tasksAddress, this.tasksABI, this.provider));
        this.tasksamaInstance = markRaw(new ethers.Contract(this.tasksamaAddress, this.tasksamaABI, this.provider));
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

      async callContractFunction(contractName, functionName, functionType, params, eth) {        
        let result;
        let transactionReceipt;
        if(contractName == "TaskSama") {
          if(functionType == "payable") {
            result = await this.tasksamaInstance[functionName](...(params ? [...params] : []), { value: ethers.utils.parseEther(eth) });
            transactionReceipt = await result.wait();
            console.log("transactionReceipt",transactionReceipt);
          }
          else  {
            result = await this.tasksamaInstance[functionName](...(params ? [...params] : []));
            if(functionType=="stateChanging") {
              transactionReceipt = await result.wait();
              console.log("transactionReceipt",transactionReceipt);
            }
          }

        } else if(contractName == "Tasks") {
          if(functionType=="payable"){
            result = await this.tasksInstance[functionName](...(params ? [...params] : []), { value: ethers.utils.parseEther(eth) });
            transactionReceipt = await result.wait();
            console.log("transactionReceipt",transactionReceipt);
          } 
          else {
            result = await this.tasksInstance[functionName](...(params ? [...params] : []));
            if(functionType=="stateChanging") {
              transactionReceipt = await result.wait();
              console.log("transactionReceipt",transactionReceipt);
            }
          }
        }
        
        return { result, transactionReceipt} 
      },

      getAvatarImg(size, seed) {
        const icon = jazzicon(size, seed == undefined ? Math.round(Math.random() * 10000000) : seed).outerHTML; //generates a size 20 icon as an HTML string. we use outerHTML because v-html renders only html strings
        return icon;
      },

      logConnectionDetails() {
        console.log("isConnected",this.isConnected)
        console.log("walletAddress",this.walletAddress)
        console.log("signer",this.signer)
        console.log("provider",this.provider)
        console.log("tasksInstance",this.tasksInstance)
        console.log("tasksamaInstance",this.tasksamaInstance)
        console.log("isAllSetUp",this.isAllSetUp)
      }

    },
  })

  function jsonParse(object) {
    return JSON.parse(JSON.stringify(object));
  }
  