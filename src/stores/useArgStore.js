import { defineStore } from 'pinia'

export const useArgStore = defineStore('arguments', {

    state: () => ({
        arguments: {  }
    }),

    getters: {
        getArguments: (state) => JSON.parse(JSON.stringify(state.arguments)) // Be careful to use this when dealing with File inputs. better access directly "arguments" store variable.
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