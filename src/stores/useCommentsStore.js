import { defineStore } from 'pinia'
import { useConnectionStore } from "./useConnectionStore";
import axios from 'axios';

export const useCommentsStore = defineStore('commentsStore', {

    state: () => ({
        comments: [],
    }),

    actions: {
        async getComments(tokenId) {
            const promise = axios.get(`${import.meta.env.VITE_DEV_BACKEND_URL}/getComments?tokenId=${tokenId}`)
            return promise;
        },

        async postComment(tokenId, commentBody) {
          const promise = axios.post(import.meta.env.VITE_DEV_BACKEND_URL + '/postComment', { tokenId, commentBody })
          return promise;
        },

        upComment(commentId) {
            const promise = axios.post(`${import.meta.env.VITE_DEV_BACKEND_URL}/upComment`, { commentId })
            return promise;
        },

        downComment(commentId) {
            const promise = axios.post(`${import.meta.env.VITE_DEV_BACKEND_URL}/downComment`, { commentId })
            return promise;
        }
    }

});