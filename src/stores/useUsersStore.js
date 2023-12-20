import { defineStore } from 'pinia'
import axios from 'axios';

export const useUsersStore = defineStore('users', {

    state: () => ({
        _id: '',
        username: '',
        seed: 0,
        creationDate: ''
    }),

    actions: {
        // We don't need to specify anything because of the authToken that is already set in the header (look ConnectionStore)
        async getUserData() {
            const promise = axios.get(`${import.meta.env.VITE_DEV_BACKEND_URL}/getUserData`).then((response) => {
                this._id = response.data.data._id;
                this.username = response.data.data.username;
                this.seed = response.data.data.seed;
                this.creationDate = response.data.data.creationDate;
            }).catch((error) => {
                console.log(error);
            });
            return promise;
        },

        // This checks if the user already exists in the database. If not, it creates it with a random seed and username
        async verifyUser() {
            const promise = axios.post(import.meta.env.VITE_DEV_BACKEND_URL + '/verifyUser');
            return promise;
        },

        async editUsername(username) {
            const promise = axios.post(import.meta.env.VITE_DEV_BACKEND_URL + '/editUsername', { username }).then((response) => {
                this.username = response.data.data;
            });
            return promise;
        },

        resetUserData() {
            this._id = '';
            this.username = '';
            this.seed = 0;
            this.creationDate = '';
        }
    }

});