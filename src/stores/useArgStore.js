import { defineStore } from 'pinia'

export const useArgStore = defineStore('arguments', {

    state: () => ({
        //similar hashMap
        arguments: {}
    }),

    getters: {
        getArguments: (state) => JSON.parse(JSON.stringify(state.arguments))
    },

    actions: {
        resetArgs() {
            this.arguments = {};
        },

        pushArg(arg) {
            this.arguments[arg.key] = arg.value;
        }
    }

});