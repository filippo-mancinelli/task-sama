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
            axios.get('http://localhost:3000/initVideoMetadata').then(response => {
                this.videoMetadata = response.data.data;
            }).catch(error => {
                console.error('Error fetching metaData: ',error);
            });
        },


         //fetch total likes per video and an array of wallets who liked it. Then check for each video 
         //if the current user is present inside the array of likes. In that case we update 'userLikedVideos' mapping 
        async initLikes(walletAddress) {
            const promise = axios.get('http://localhost:3000/initLikes').then(response => {
                response.data.data.forEach(video => {
                    this.totalLikesPerVideo.set(video.tokenId, video.likes);
                    this.walletsLikesPerVideo.set(video.tokenId, video.likeWallets);

                    video.likeWallets.forEach(wallet => {
                        if(walletAddress == wallet) {
                            this.userLikedVideos.set(video.tokenId, true)
                        }
                    })
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


  