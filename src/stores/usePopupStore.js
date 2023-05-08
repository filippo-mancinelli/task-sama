import { defineStore } from 'pinia'

export const usePopupStore = defineStore('popup', {

    state: () => ({
        //similar hashMap
        showPopup: false,
        messageType: '',
        message: ''
    }),

    getters: {
        getShowPopup: (state) => { return this.showPopup }
    },

    actions: {
        setPopup(show, msgType, msg) {
            this.messageType = msgType;
            this.message = msg;
            this.showPopup = show;
            
        }
    }

});