import { defineStore } from "pinia";

export const useTaskStore = defineStore('tasks', {
    state: () => {
        tasksMetadata: null
    },

    getters: {
        getTasksMetadata: (state) => { return this.tasksMetadata }
    },

    actions: {
        setPopup(show, msgType, msg) {
            const promise = axios.get(import.meta.env.VITE_BACKEND_URL + '/initLikes').then(response => {
            
            })
        },
    }
})