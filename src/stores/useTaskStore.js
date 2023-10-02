import { defineStore } from "pinia";
import { useConnectionStore } from "./useConnectionStore";
import { ethers } from "ethers";
import axios from 'axios';

export const useTaskStore = defineStore('api', {
    state: () => ({
        tasksMetadata: [], //fetch from blockchain
        userMetadata: {}
    }),

    actions: {
        // ###### VIDEO API ###### //

        uploadVideoToDB(file, tokenId) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('tokenId', tokenId);

            return axios
              .post(import.meta.env.VITE_DEV_BACKEND_URL + '/uploadVideoToDB', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              })
              .then((response) => {
                console.log('Video uploaded successfully:', response.data);
                return response.data;
              })
              .catch((error) => {
                console.error('Error uploading video:', error);
                throw error;
              });
          },

        uploadVideoToIpfs(show, msgType, msg) {
            const promise = axios.get(import.meta.env.VITE_DEV_BACKEND_URL + '/uploadVideoToIpfs').then(response => {

            });
            return promise;
        },

        // ###### IMAGES API ###### //
        uploadImageToDB(file) {
            const promise =  axios.post(import.meta.env.VITE_DEV_BACKEND_URL + '/uploadImageToDB').then(response => {
                
            });
            return promise;
        },


        // ###### TASKS ####### //

        // Fetch the list of tasks NFT metadata from blockchain
        async fetchTasksMetadata() { 
            const promise = useConnectionStore().callContractFunction("Tasks", "_getTasks").then(response => {
                const { result } = response;
                const modifiedMetadata = result.map(task => {
                    return {
                        ...task,
                        tokenId: parseInt(task.tokenId),
                        reward: parseFloat(ethers.utils.formatEther(ethers.BigNumber.from(task.reward))).toFixed(2)
                    }
                });
                this.tasksMetadata = modifiedMetadata;
                return this.tasksMetadata;
            });
            return promise;
        },

        //fetch a single task NFT metadata from blockchain
        async fetchTaskMetadata(tokenId) {
            // We need to convert a number to a BigNumber in order to pass it as a parameter to a smart contract function
            const taskId = ethers.BigNumber.from(tokenId).toString(); 
            const promise = useConnectionStore().callContractFunction("Tasks", "_getTask", "", [taskId]).then(response => {
                response.tokenId = tokenId;
                response.reward = parseFloat(ethers.utils.formatEther(ethers.BigNumber.from(response.result.reward))).toFixed(2);
                return response;
            });
            return promise;
        },

        // Fetch user activity on-chain about tasks TODO
        fetchUserMetadata() {  
            const promise = useConnectionStore().callContractFunction("TaskSama", "getVideos").then(response => {
                const { result } = response;
                const modifiedMetadata = result.map(video => {
                    return {
                        ...video,
                        tokenId: parseInt(task.tokenId),
                        reward: parseFloat(ethers.utils.formatEther(ethers.BigNumber.from(task.reward))).toFixed(2)
                    }
                });
                this.tasksMetadata = modifiedMetadata;
                
                return this.tasksMetadata;
            });
            return promise;
        },

        //fetch task image from DB
        fetchTaskImages() {
            const promise = axios.get(import.meta.env.VITE_DEV_BACKEND_URL + '/fetchTaskImages').then(response => {
                console.log("response",response);
                this.tasksMetadata = response.data;
                return response.data;
            });
            return promise;
        },

    }
})