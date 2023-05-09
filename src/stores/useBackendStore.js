import { defineStore } from 'pinia'

export const useBackendStore = defineStore('BackendConnection', {

    state: () => ({
        url: ''
    }),

    getters: {
        getUrl: (state) => state.url
    },

    actions: {
        async connect() {
            //DB fetch mapping likes
        },
    }

});
