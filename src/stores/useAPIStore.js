import { defineStore } from "pinia";
import { useConnectionStore } from "./useConnectionStore";
import { ethers } from "ethers";

export const useAPIStore = defineStore('api', {
    state: () => ({
        tasksMetadata: [] //fetch from blockchain
    }),

    actions: {
        // ###### VIDEOS ###### //
        uploadVideoToDB(file) {
            const promise = axios.post(import.meta.env.VITE_BACKEND_URL + '/uploadVideoToDB').then(response => {

            });
            return promise;
        },

        uploadVideoToIpfs(show, msgType, msg) {
            const promise = axios.get(import.meta.env.VITE_BACKEND_URL + '/uploadVideoToIpfs').then(response => {

            });
            return promise;
        },

        // ###### IMAGES ###### //
        uploadImageToDB(file) {
            const promise =  axios.post(import.meta.env.VITE_BACKEND_URL + '/uploadImageToDB').then(response => {
                
            });
            return promise;
        },


        // ###### TASKS ####### //

        //fetch NFT metadata from blockchain
        fetchTasksMetadata() { 
            const promise = useConnectionStore().callContractFunction("Tasks", "_getTasks").then(response => {
                const modifiedMetadata = response.map(task => {
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

        //fetch task image from DB
        fetchTaskImages() {
            const promise = axios.get(import.meta.env.VITE_BACKEND_URL + '/fetchTaskImages').then(response => {
                console.log("response",response);
                this.tasksMetadata = response.data;
                return response.data;
            });
            return promise;
        },






    }
})