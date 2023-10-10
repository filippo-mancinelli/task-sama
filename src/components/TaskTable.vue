<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount, toRefs } from 'vue';
import { useConnectionStore } from '../stores/useConnectionStore';
import { useTaskStore } from '../stores/useTaskStore'
import Task from './Task.vue';
import _ from 'lodash';

const taskStore = useTaskStore();
const connectionStore = useConnectionStore();

const { tasksMetadata: tasks } = toRefs(taskStore);
const { tasksImages: images } = toRefs(taskStore);

//### SEARCH FILTERS ####
const searchQuery = ref("");
const sortOrder = ref("tokenId");
const sortDirection = ref("asc");

const filteredTasks = computed(() => {
  let results = tasks && tasks.value ? tasks.value : [];

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

    if (sortOrder.value === "tokenId") {
        results = _.orderBy(results, ["tokenId"], [sortDirection.value]);
    } else if (sortOrder.value === "reward") {
        results = _.orderBy(results, ["reward"], [sortDirection.value]);
    }

    return results;
});

const sortTasks = () => {
    if (sortOrder.value === "tokenId") {
      tasks.value = _.orderBy(tasks.value, ["tokenId"], [sortDirection.value]);
    } else if (sortOrder.value === "reward") {
      tasks.value = _.orderBy(tasks.value, ["reward"], [sortDirection.value]);
    }
};

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
};

//###### task columns ######//
const calculateColumnNumber = () => {
  var result = 3;

  if(window.innerWidth <= 900) {
    result = 1;
  } else if(window.innerWidth <= 1200) {
    result = 2;
  } else if (window.innerWidth <= 1700) {
    result = 3;
  } else {
    result = 4;
  }
  return result;
}
const screenSizeColumns =  ref(calculateColumnNumber());

//### REFRESH METADATA ####
async function refreshTasksMetadata() {
  tasks.value = await taskStore.fetchTasksMetadata();
  images.value = await taskStore.fetchTasksImages();

  images.value.data.forEach((image) => {
    tasks.value.forEach((task) => {
      if(parseInt(image.taskId) == task.tokenId) {
        task.base64Image = image.data;
      } else if(task.base64Image == undefined){
        task.base64Image = 'noimage';
      }
    });
  });
}

//Define callback function for event listeners for updating columns on screen resize 
const resizeEventListener = function(event){
  screenSizeColumns.value = calculateColumnNumber();
};

onMounted(() => {
  watch(() => [connectionStore.walletAddress, connectionStore.tasksInstance], async (instance) => {
    if(instance != null) {
      await refreshTasksMetadata();
    }
  });

  watch(() => tasks.value, () => {
    if (connectionStore.walletAddress != null && connectionStore.tasksInstance != null) {
      tasks.value.forEach((task) => {
        task.isParticipating = false;
        for (let i = 0; i < task.participants.length; i++) {
          if(task.participants[i] == connectionStore.walletAddress) {
            task.isParticipating = true;
          }
        }
      });
    }
  });

  //listeners for updating columns 
  window.addEventListener('resize', resizeEventListener);
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeEventListener);
});

</script>

<template>
  <div id="tasks" class="my-10 content-center">
    <p class="text-center text-5xl font-extrabold text-black drop-shadow-lg drop-shadow-orange-500">Tasks to do</p>
  </div>

  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-40 my-4">
    <input type="text" v-model="searchQuery" class="w-full py-2 px-3  mb-2 sm:mb-0 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" placeholder="Search tasks...">
    <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
      <select v-model="sortOrder" @change="sortTasks" class="px-4 py-2 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent">
        <option value="tokenId" class="hover:bg-orange-200">Sort by ID</option>
        <option value="reward">Sort by Reward</option>
      </select>
      <button @click="toggleSortDirection" class="px-4 py-2 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent">
        {{ sortDirection === 'asc' ? 'Ascending' : 'Descending'}}
      </button>
    </div>
  </div>

  <div class="card-table px-4 sm:px-40 mt-10">
    <div v-for="(taskRow, index) in _.chunk(filteredTasks, screenSizeColumns)" :key="index" class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
      <div v-for="task in taskRow" class="w-full">
        <Task
          :tokenId="task.tokenId"
          :title="task.title"
          :description="task.description"
          :reward="task.reward"
          :participants="task.participants"
          :isParticipating="task.isParticipating"
          :base64Image="task.base64Image"
          @sentParticipation="() => refreshTasksMetadata()"
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
