import { defineStore } from 'pinia'
import { useConnectionStore } from './useConnectionStore'
import { ethers } from 'ethers';
import axios from 'axios';

export const useVideoStore = defineStore('videoNFTs', {

    state: () => ({
        videoMetadata: [], //fetch from blockchain
        likesMetadata: new Map(), //fetch from backend
        isDataReady: false //just a flag used by components to watch metadata to be defined or not empty
    }),

    getters: {
        getArguments: (state) => JSON.parse(JSON.stringify(state.arguments))
    },

    actions: {
        async initVideoMetadata() {
                //fetch from blockchain
                const { result } = await useConnectionStore().callContractFunction("TaskSama", "getVideos");
                const fetchedMetadata = result;

                // Create a new array with modified objects
                const modifiedMetadata = fetchedMetadata.map(metadata => {
                    return {
                    ...metadata,
                    tokenId: parseInt(metadata.tokenId),
                    rewardEarned: parseFloat(ethers.utils.formatEther(ethers.BigNumber.from(metadata.rewardEarned))).toFixed(2)
                    };
                });
                this.videoMetadata = modifiedMetadata;
                return this.videoMetadata;
        },

         //fetch total likes per video, an array of wallets who liked it, and the status (isLiked)
        async initLikes(walletAddress) {
            const promise = axios.post(import.meta.env.VITE_DEV_BACKEND_URL + '/initLikes', {walletAddress}).then(response => { 
                response.data.data.forEach(video => {
                    this.likesMetadata.set(video.tokenId, { "likeCount": video.likes, "likeWallets": video.likeWallets, "isLiked": video.isLiked });
                });
                return this.likesMetadata;
            }).catch(error => {
                console.error('Error fetching likes to videos: ',error);
            });
            return promise;
        },


        async like(tokenId, isLiked, walletAddress) {
            const result = await axios.post(import.meta.env.VITE_DEV_BACKEND_URL + '/like', {tokenId, isLiked, walletAddress});
            const tempMetadata = this.likesMetadata.get(tokenId);
            tempMetadata.likeCount = result.data;
            this.likesMetadata.set(tokenId, tempMetadata);
            return result.data;
        },


        jsonParse(object) {
            return JSON.parse(JSON.stringify(object));
        }
        
    }

});


  