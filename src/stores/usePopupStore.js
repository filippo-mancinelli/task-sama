import { defineStore } from 'pinia'

export const usePopupStore = defineStore('popup', {

    state: () => ({
        showPopup: false,
        messageType: '',
        message: '',
    }),

    actions: {
        setPopup(show, msgType, msg) {
            this.messageType = msgType;
            this.message = msg;
            this.showPopup = show;
        }
    }

});