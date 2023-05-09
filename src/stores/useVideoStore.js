import { defineStore } from 'pinia'

export const useVideoStore = defineStore('videoNFTs', {

    state: () => ({
        likesToNFT: new Map()
    }),

    getters: {
        getArguments: (state) => JSON.parse(JSON.stringify(state.arguments))
    },

    actions: {
        async initLikes() {
            //DB fetch mapping likes
        },
    }

});
