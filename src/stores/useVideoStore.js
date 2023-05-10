import { defineStore } from 'pinia'
import { watch } from 'vue';
import axios from 'axios';


export const useVideoStore = defineStore('videoNFTs', {

    state: () => ({
        videoMetadata: [], //fetch from blockchain
        likesToVideo: new Map(), //fetch from backend
        ready: false
    }),

    getters: {
        getArguments: (state) => JSON.parse(JSON.stringify(state.arguments))
    },

    actions: {
        async initVideoMetadata() {
            axios.get('http://localhost:3000/getAllVideos').then(response => {
                this.videoMetadata = response.data.data;
            }).catch(error => {
                console.error('Error fetching metaData: ',error);
            });
        },

        async initLikes() {
            return axios.get('http://localhost:3000/getLikes').then(response => {
                response.data.data.forEach(element => {
                    this.likesToVideo.set(element.tokenId, element.likes);
                    this.ready = true;
                });
            }).catch(error => {
                console.error('Error fetching likes: ',error);
            });
        },

        async like(tokenId, isLiked) {
            const result = await axios.post('http://localhost:3000/like', {tokenId, isLiked});
            this.likesToVideo.set(tokenId, result.data);
            return result.data;
        },

        jsonParse(object) {
            return JSON.parse(JSON.stringify(object));
        }
        
    }

});


  