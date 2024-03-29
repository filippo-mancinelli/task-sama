import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { tasksAddress, tasksamaAddress } from '../helpers/contractAddresses';
import { defineStore } from 'pinia'
import { useUsersStore } from './useUsersStore';
import { watch, markRaw  } from 'vue';
import Web3Token from 'web3-token';
import TasksABI from "../helpers/TasksABI.json";
import TasksamaABI from "../helpers/TasksamaABI.json";
import jazzicon from "@metamask/jazzicon";
import axios from 'axios';

export const useConnectionStore = defineStore('metamaskConnection', {

    state: () => ({ 
        authToken: localStorage.getItem('authToken') == 'null' ? 'null' : localStorage.getItem('authToken'),
        provider: null,
        signer: null,
        walletAddress: null,
        accounts: [],
        isConnected: !localStorage.getItem('disconnectPreference') === 'true',
        tasksABI: TasksABI.abi,
        tasksamaABI: TasksamaABI.abi,
        tasksAddress: tasksAddress, // ganache generated
        tasksamaAddress: tasksamaAddress, // ganache generated
        tasksInstance: null,
        tasksamaInstance: null,
        isAllSetUp: false,
        triggerEvent: false  // generic state to watch from component to trigger a refresh of something
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
        watch(() => this.isConnected, async (newValue) => {
          await this.setProvider();
          
          if(newValue == true) {
            if(localStorage.getItem('disconnectPreference') === 'false') {
              await this.setSigner();
              await this.setWalletAddress();
            } else {
              this.isConnected = false;
            }
          }
          this.setAllSetUp()
        });

        if(this.hasMetamask()){
          window.ethereum.on('accountsChanged', async (accounts) => {
            this.accounts = accounts;
            if (accounts.length > 0 && localStorage.getItem('disconnectPreference') === 'false') {
              this.isConnected = true;
            } else {
              this.isConnected = false;
              this.walletAddress = null;
              await this.setProvider();
            }
          });        
        } 

        // If the authToken is already stored in localStorage, we set it as default header for axios 
        // and then fetch user profile data from backend using it 
        if(this.authToken != 'null') {
          axios.defaults.headers.common['Authorization'] = this.authToken;
          useUsersStore().verifyUser();
          useUsersStore().getUserData();
        }

        this.triggerEvent = !this.triggerEvent;
      },

      async checkConnection() {
        if (this.hasMetamask()) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          this.accounts = accounts;
          this.isConnected = accounts.length > 0;
          await this.setProvider();
          await this.setSigner();
          await this.setWalletAddress();  

          if (this.isConnected) return this.walletAddress;
        }
      },
      
      async connect() {
        if(this.hasMetamask()){
          await window.ethereum.request({
            method: "wallet_requestPermissions",
            params: [
              {
                eth_accounts: {}
              }
            ]
          });
          await this.setProvider();
          await this.setSigner();
          await this.setWalletAddress();  
          this.isConnected = true;
          localStorage.setItem('disconnectPreference', 'false');

          // Trigger this event to propagate all components that are watching it that the connection has changed
          this.triggerEvent = !this.triggerEvent;
        } else {
          console.log("install metamask!")
        }
      },

      async disconnect() {
        if (this.isConnected) {
          if (this.hasMetamask()) {
            this.isConnected = false;
            this.walletAddress = null;
            this.authToken = 'null';
            await this.setProvider();
            await this.setSigner();
            useUsersStore().resetUserData();
            localStorage.setItem('disconnectPreference', 'true')
            localStorage.setItem('authToken', 'null');

            // Trigger this event to propagate all components that are watching it that the connection has changed
            this.triggerEvent = !this.triggerEvent;
          }
        }
      },

      async changeAccount(newAddress) {
        this.walletAddress = newAddress;
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
          this.provider = markRaw(new ethers.providers.JsonRpcProvider(import.meta.env.GANACHE_URL_DEV));  //ganache
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
          this.walletAddress = this.walletAddress.toLowerCase();
        }
      },

      async setAuthToken() {
        if(this.signer && this.authToken == 'null') {
          this.authToken = await Web3Token.sign(async msg => await this.signer.signMessage(msg), '1d');
          axios.defaults.headers.common['Authorization'] = this.authToken;
          localStorage.setItem('authToken', this.authToken);
          useUsersStore().verifyUser();
          useUsersStore().getUserData();
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
  