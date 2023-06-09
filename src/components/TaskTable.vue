<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
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

//###### card columns ######//
const calculateColumnNumber = () => {
  var result = 3;

  if(window.innerWidth <= 1000) {
    result = 2;
  } else if (window.innerWidth <= 1700) {
    result = 3;
  } else {
    result = 4;
  }
  return result;
}
const screenSizeColumns =  ref(calculateColumnNumber());

onMounted(() => {
  window.addEventListener('resize', function(event){
    screenSizeColumns.value = calculateColumnNumber();
  });
})

onBeforeUnmount(() => {
  window.removeEventListener('resize')
});

</script>

<template>
  <div id="tasks" class="my-10 content-center">
    <p class="text-center text-5xl font-extrabold text-black drop-shadow-lg drop-shadow-orange-500">Tasks to do</p>
  </div>

  <div class="flex flex-col items-center px-4 md:px-40 space-y-2 md:space-x-2 md:space-y-0 mt-10">
    <input type="text" v-model="searchQuery" class="w-full py-2 pl-3 pr-10 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" placeholder="Search tasks...">
    <div class="flex items-center space-x-2">
      <select v-model="sortOrder" @change="sortTasks" class="px-4 py-2 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent">
        <option value="id" class="hover:bg-orange-200">Sort by ID</option>
        <option value="reward">Sort by Reward</option>
      </select>
      <button @click="toggleSortDirection" class="ml-2 px-4 py-2 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent">
        {{ sortDirection === 'asc' ? 'Ascending' : 'Descending'}}
      </button>
    </div>
  </div>

  <div class="card-table px-4 md:px-40 mt-10">
  <div
    v-for="(taskRow, index) in _.chunk(filteredTasks, screenSizeColumns)"
    :key="index"
    class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4"
  >
    <div v-for="task in taskRow" class="w-full">
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
  option:hover {
    background-color: #ffbb55;
  }
</style>
