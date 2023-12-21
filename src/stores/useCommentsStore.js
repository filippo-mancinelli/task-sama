import { defineStore } from 'pinia'
import { useConnectionStore } from "./useConnectionStore";
import axios from 'axios';

export const useCommentsStore = defineStore('commentsStore', {

    state: () => ({
        comments: [],
    }),

    actions: {
        async getComments(tokenId, category) {
            const promise = axios.get(`${import.meta.env.VITE_BACKEND_URL}/getComments?tokenId=${tokenId}&category=${category}`)
            return promise;
        },

        async postComment(tokenId, commentBody, category) {
          const promise = axios.post(import.meta.env.VITE_BACKEND_URL + '/postComment', { tokenId, commentBody, category });
          return promise;
        },

        async deleteComment(commentId) {
            const promise = axios.post(`${import.meta.env.VITE_BACKEND_URL}/deleteComment`, { commentId })
            return promise;
        },

        // These two endpoints returns the updated comment document
        upComment(commentId, isUp) {
            const promise = axios.post(`${import.meta.env.VITE_BACKEND_URL}/upComment`, { commentId, isUp })
            return promise;
        },

        downComment(commentId, isDown) {
            const promise = axios.post(`${import.meta.env.VITE_BACKEND_URL}/downComment`, { commentId, isDown })
            return promise;
        }
    }

});