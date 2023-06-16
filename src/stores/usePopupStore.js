import { defineStore } from 'pinia'

export const usePopupStore = defineStore('popup', {

    state: () => ({
        showPopup: false,
        messageType: '',
        message: '',
        popupType: 'noModal'  //if we show the popup when a modal is open, we set the height differently
    }),

    actions: {
        setPopup(show, msgType, msg, popType) {
            this.messageType = msgType;
            this.message = msg;
            this.showPopup = show;
            this.popupType = popType;
        }
    }

});