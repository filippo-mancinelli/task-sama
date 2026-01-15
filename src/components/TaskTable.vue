<script setup lang="ts">
import { ref, watch, computed, onMounted, onBeforeUnmount, toRefs } from 'vue';
import { useSolanaWalletStore } from '../stores/useSolanaWalletStore';
import { useSolanaTaskStore } from '../stores/useSolanaTaskStore'
import Task from './Task.vue';
import _ from 'lodash';

const taskStore = useSolanaTaskStore();
const walletStore = useSolanaWalletStore();

const { tasks } = toRefs(taskStore);

//### SEARCH FILTERS ####
const searchQuery = ref("");
const sortOrder = ref("taskId");
const sortDirection = ref("asc");
const currentPage = ref(1);
const visibleCardsNumber = ref(9);

const filteredTasks = computed(() => {
  let results = tasks && tasks.value ? tasks.value : [];

  // Filter by search query
  if (searchQuery.value) {
    results = _.filter(results, (task) => {
      return (
        task.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    });
  }

  // Sort
  if (sortOrder.value === "taskId") {
    results = _.orderBy(results, ["taskId"], [sortDirection.value]);
  } else if (sortOrder.value === "rewardAmount") {
    results = _.orderBy(results, ["rewardAmount"], [sortDirection.value]);
  }

  // Pagination
  const startIndex = (currentPage.value - 1) * visibleCardsNumber.value;
  const endIndex = startIndex + visibleCardsNumber.value;
  return results.slice(startIndex, endIndex);
});

const sortTasks = () => {
  if (sortOrder.value === "taskId") {
    tasks.value = _.orderBy(tasks.value, ["taskId"], [sortDirection.value]);
  } else if (sortOrder.value === "rewardAmount") {
    tasks.value = _.orderBy(tasks.value, ["rewardAmount"], [sortDirection.value]);
  }
};

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
};

//###### task columns ######//
const calculateColumnNumber = () => {
  var result = 3;
  visibleCardsNumber.value = 9;

  if(window.innerWidth <= 900) {
    result = 1;
  } else if(window.innerWidth <= 1200) {
    result = 2;
    visibleCardsNumber.value = 8;
  } else if (window.innerWidth <= 1700) {
    result = 3;
  } else {
    result = 4;
    visibleCardsNumber.value = 8;
  }
  return result;
}
const screenSizeColumns =  ref(calculateColumnNumber());

//###### pagination ######//
function prevPage() {
  if(currentPage.value > 1) {
    currentPage.value--;
  }
}

function nextPage() {
  const totalPages = Math.ceil(tasks.value.length / 9);
  if (currentPage.value < totalPages) {
    currentPage.value++;
  }
}


//### REFRESH METADATA ####
async function refreshTasksMetadata() {
  await taskStore.fetchTasks();

  // Fetch task images from backend
  // TODO: Implement fetchTasksImages if needed
  // const images = await axios.get('/fetchTasksImages')
}

//Define callback function for event listeners for updating columns on screen resize
const resizeEventListener = function(event){
  screenSizeColumns.value = calculateColumnNumber();
};

onMounted(async () => {
  await refreshTasksMetadata();

  // Watch for wallet changes
  watch(() => [walletStore.walletAddress, walletStore.isConnected], async () => {
    await refreshTasksMetadata();
  });

  // Update isParticipating flag for each task
  watch(() => tasks.value, () => {
    if (walletStore.walletAddress && tasks.value) {
      tasks.value.forEach((task: any) => {
        task.isParticipating = false;
        // Check if wallet address is in participants array
        // Note: In Solana, we need to fetch ParticipantRecord PDAs
        // For now, simplified version
        if (task.participantCount > 0) {
          // TODO: Fetch participant records to check if user is participating
          task.isParticipating = false;
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
        <option value="taskId" class="hover:bg-orange-200">Sort by ID</option>
        <option value="rewardAmount">Sort by Reward</option>
      </select>
      <button @click="toggleSortDirection" class="px-4 py-2 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent">
        {{ sortDirection === 'asc' ? 'Ascending' : 'Descending'}}
      </button>
      <div class="join self-center">
          <button @click="prevPage" class="join-item btn bg-white border-orange-200">«</button>
          <button class="join-item btn bg-white border-orange-200">Page {{ currentPage }}</button>
          <button @click="nextPage" class="join-item btn bg-white border-orange-200">»</button>
      </div>
    </div>
  </div>

  <div class="card-table px-4 sm:px-40 mt-10">
    <div v-for="(taskRow, index) in _.chunk(filteredTasks, screenSizeColumns)" :key="index" class="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
      <div v-for="task in taskRow" :key="task.taskId">
        <Task
          :tokenId="task.taskId"
          :title="task.title"
          :description="task.description"
          :reward="(task.rewardAmount / 1_000_000_000).toFixed(2)"
          :participants="[]"
          :isParticipating="task.isParticipating || false"
          :base64Image="task.base64Image || 'noimage'"
          :timestamp="new Date(task.createdAt * 1000).toLocaleDateString()"
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
