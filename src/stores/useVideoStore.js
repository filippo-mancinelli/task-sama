import { defineStore } from 'pinia'
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
        // Completed-task video NFTs. These live on-chain (Solana program); until the
        // program is deployed there are none to fetch, so this resolves to an empty list.
        async initVideoMetadata() {
                this.videoMetadata = [];
                this.isDataReady = true;
                return this.videoMetadata;
        },

         //fetch total likes per video, an array of wallets who liked it, and the status (isLiked)
        async initLikes(walletAddress) {
            const promise = axios.post(import.meta.env.VITE_BACKEND_URL + '/initLikes', {walletAddress}).then(response => { 
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
            const result = await axios.post(import.meta.env.VITE_BACKEND_URL + '/like', {tokenId, isLiked, walletAddress});
            const tempMetadata = this.likesMetadata.get(tokenId);
            tempMetadata.likeCount = result.data;
            this.likesMetadata.set(tokenId, tempMetadata);
            return result.data;
        },

        // Initialize a new document to DB collection "likes" in order to be able to display the newly minted NFT in the homepage
        async addNewNftLikeDocument(tokenId) {
            const promise = axios.post(import.meta.env.VITE_BACKEND_URL + '/addNewNftLikeDocument', {tokenId});
            return promise;
        },
        
        // Since we upload the video to IPFS regardless of the minting process, we need to tell the DB if the minting was successful or not by giving the tokenID
        async confirmNFTId(IPFSMetadataUrl, tokenId) {
            const promise = axios.post(import.meta.env.VITE_BACKEND_URL + '/confirmNFTId', {IPFSMetadataUrl, tokenId});
            return promise;
        },

        // Metadata of a single video NFT (on-chain). No deployed program yet -> null.
        async fetchTasksamaMetadata(tokenId) {
            return null;
        },

        // Make a request to the backend to use it as proxy for fetching video from IPFS for avoiding CORS troubles
        async getVideoFromIPFS(ipfsUrl) { 
            const promise = axios.get(`${import.meta.env.VITE_BACKEND_URL}/getVideoFromIPFS?ipfsUrl=${ipfsUrl}`, { responseType: 'arraybuffer', })
            return promise;
        },

        jsonParse(object) {
            return JSON.parse(JSON.stringify(object));
        }
        
    }

});

function getFormattedTimestampDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 as months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
  
    // Create the formatted date string in YYYY/MM/DD format
    const formattedDate = `${year}/${month}/${day} GMT+0100`; // Replace GMT+0100 with your timezone
  
    return formattedDate;
};