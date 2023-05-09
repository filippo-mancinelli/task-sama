<script setup>
import { ref, computed } from 'vue';
import { useConnectionStore } from '../stores/useConnectionStore';
import Task from './Task.vue';
import _ from 'lodash';

//immediately fetch task nfts
const connectionStore = useConnectionStore();

const tasks = ref([
    { id: 1, title: "Task 1", description: "Description 1", reward: 10 },
    { id: 2, title: "Task 2", description: "Description 2", reward: 20 },
    { id: 3, title: "Task 3", description: "Description 3", reward: 30 },
    { id: 4, title: "Task 4", description: "Description 4", reward: 40 },
    { id: 5, title: "Task 5", description: "Description 5", reward: 50 },
]);

const searchQuery = ref("");
const sortOrder = ref("id");
const sortDirection = ref("asc");

const filteredTasks = computed(() => {
    let results = tasks.value;

    if (searchQuery.value) {
        results = _.filter(results, (task) => {
            return (
                task.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                task.description
                .toLowerCase()
                .includes(searchQuery.value.toLowerCase())
            );
        });
    }

    if (sortOrder.value === "id") {
        results = _.orderBy(results, ["id"], [sortDirection.value]);
    } else if (sortOrder.value === "reward") {
        results = _.orderBy(results, ["reward"], [sortDirection.value]);
    }

    return results;
});

const sortTasks = () => {
    if (sortOrder.value === "id") {
      tasks.value = _.orderBy(tasks.value, ["id"], [sortDirection.value]);
    } else if (sortOrder.value === "reward") {
      tasks.value = _.orderBy(tasks.value, ["reward"], [sortDirection.value]);
    }
};

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";

};

</script>

<template>
<div id="tasks" class="my-10 content-center">
  <p class="text-center text-6xl font-extrabold text-black drop-shadow-lg drop-shadow-orange-500">Tasks to do</p>
</div>

    <div class="flex items-center px-40 space-x-2 mt-10">
      <input type="text" v-model="searchQuery" class="w-full py-2 pl-3 pr-10 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" placeholder="Search tasks...">
      <select v-model="sortOrder" @change="sortTasks" class="px-4 py-2 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent">
          <option value="id" class="hover:bg-orange-200">Sort by ID</option>
          <option value="reward">Sort by Reward</option>
      </select>
      <button @click="toggleSortDirection" class="ml-2 px-4 py-2 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent">
        {{ sortDirection === 'asc' ? 'Ascending' : 'Descending'}}
      </button>
    </div>

  
    <div class="card-table px-40 mt-10">
      <div
        v-for="(taskRow, index) in _.chunk(filteredTasks, 3)"
        :key="index"
        class="flex space-x-3 mb-4"
      >
      <div v-for="task in taskRow">
        <Task
          :id="task.id"
          :title="task.title"
          :description="task.description"
          :reward="task.reward"
          class="bg-white text-black"
        />
      </div>


      </div>

    </div>
  </template>

<style scoped>
    .card-table {
    display: flex;
    flex-direction: column;
    }
    .card-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    }
    option:hover {
    background-color: #ffbb55;
    }
</style>

