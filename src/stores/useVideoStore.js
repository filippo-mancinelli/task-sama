import { defineStore } from 'pinia'
import axios from 'axios';


export const useVideoStore = defineStore('videoNFTs', {

    state: () => ({
        videoMetadata: new Map(), //fetch from blockchain
        likesToVideo: new Map() //fetch from backend
    }),

    getters: {
        getArguments: (state) => JSON.parse(JSON.stringify(state.arguments))
    },

    actions: {
        async initVideoMetadata() {
            axios.get('http://localhost:3000/getAllVideos').then(response => {
                response.data.data.forEach((video) => {
                    const { tokenId, ...details } = video;
                    this.videoMetadata.set(tokenId, details);                   
                })
                console.log("videoMetadata", jsonParse(Object.fromEntries(this.videoMetadata)))
            }).catch(error => {
                console.error('Error fetching metaData: ',error);
            });
            
        },

        async initLikes() {
            axios.get('http://localhost:3000/getLikes').then(response => {
                this.likesToVideo = response.data.data;
            }).catch(error => {
                console.error('Error fetching likes: ',error);
            });
        },
        
    }

});

function jsonParse(object) {
    return JSON.parse(JSON.stringify(object));
}
  