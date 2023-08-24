import { defineStore } from 'pinia'

export const useBackgroundStore = defineStore('background', {

    state: () => ({
        backgroundClass: 'bg-background-image'
    }),

    actions: {
        changeBackgroundClass(newClass) {
            this.backgroundClass = newClass;
        }
    }

});