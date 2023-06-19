import { defineStore } from "pinia";

export const useAPIStore = defineStore('api', {
    state: () => {
        tasksMetadata: [] //fetch from blockchain
    },

    actions: {
        // ###### IPFS ###### //
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
        }


    }
})