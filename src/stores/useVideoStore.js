import { defineStore } from 'pinia'
import { useConnectionStore } from './useConnectionStore'
import axios from 'axios';

export const useVideoStore = defineStore('videoNFTs', {

    state: () => ({
        videoMetadata: [], //fetch from blockchain
        totalLikesPerVideo: new Map(), //fetch from backend
        walletsLikesPerVideo: new Map(), //fetch from backend
        userLikedVideos: new Map() //which videos the user already liked
    }),

    getters: {
        getArguments: (state) => JSON.parse(JSON.stringify(state.arguments))
    },

    actions: {
        async initVideoMetadata() {
            //fetch from blockchain
            
        },


         //fetch total likes per video and an array of wallets who liked it. Then check for each video 
         //if the current user is present inside the array of likes. In that case we update 'userLikedVideos' mapping 
        async initLikes(walletAddress) {
            const promise = axios.get('http://localhost:3000/initLikes').then(response => {
                response.data.data.forEach(video => {
                    this.totalLikesPerVideo.set(video.tokenId, video.likes);
                    this.walletsLikesPerVideo.set(video.tokenId, video.likeWallets);

                    //if the array is empty (no one liked the video) we map the current user like to false. Otherwise we iterate 
                    //the array of likes to check if the current user is present, and in case, set its mapping to true.
                    if(video.likeWallets.length > 0) {
                        video.likeWallets.forEach(wallet => {
                            this.userLikedVideos.set(video.tokenId, walletAddress == wallet ? true : false);
                        })
                    } else {
                        this.userLikedVideos.set(video.tokenId, false);
                    }
                });
                return this.userLikedVideos;
            }).catch(error => {
                console.error('Error fetching likes to videos: ',error);
            });
            return promise;
        },


        async like(tokenId, isLiked, walletAddress) {
            const result = await axios.post('http://localhost:3000/like', {tokenId, isLiked, walletAddress});
            this.totalLikesPerVideo.set(tokenId, result.data);
            return result.data;
        },


        jsonParse(object) {
            return JSON.parse(JSON.stringify(object));
        }
        
    }

});


  