<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useVideoStore } from '../stores/useVideoStore';
import { useConnectionStore } from '../stores/useConnectionStore';
import _ from 'lodash';
import Card from './Card.vue';
import { storeToRefs } from 'pinia';

const videoStore = useVideoStore();
const connectionStore = useConnectionStore();

const { videoMetadata: cards } = storeToRefs(videoStore)
const searchQuery = ref("");
const sortOrder = ref("id");
const sortDirection = ref("asc");

const filteredCards = computed(() => {
    let results = cards.value;

    if (searchQuery.value) {
        results = _.filter(results, (card) => {
            return (
                card.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                card.description
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

const sortCards = () => {
    if (sortOrder.value === "id") {
      cards.value = _.orderBy(cards.value, ["id"], [sortDirection.value]);
    } else if (sortOrder.value === "reward") {
      cards.value = _.orderBy(cards.value, ["reward"], [sortDirection.value]);
    }
};

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
};

onMounted(() => {
  watch(() => connectionStore.tasksInstance, async (instance) => {
    if(instance != null) {
      cards.value = await videoStore.initVideoMetadata();
      console.log("cards:", cards.value)
    }
  });
});

</script>

<template>
  <div id="tasks" class="my-10 content-center">
    <p class="text-center text-5xl font-extrabold text-black drop-shadow-lg drop-shadow-orange-500">Tasks completed</p>
  </div>

    <div class="flex items-center px-40 space-x-2">
      <input type="text" v-model="searchQuery" class="w-full py-2 pl-3 pr-10 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" placeholder="Search cards...">
      <select v-model="sortOrder" @change="sortCards" class="px-4 py-2 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent">
          <option value="id" class="hover:bg-orange-200">Sort by ID</option>
          <option value="reward">Sort by Reward</option>
      </select>
      <button @click="toggleSortDirection" class="ml-2 px-4 py-2 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent">
        {{ sortDirection === 'asc' ? 'Ascending' : 'Descending'}}
      </button>
    </div>

  
    <div class="card-table px-40 mt-10">
      <div
        v-for="(cardRow, index) in _.chunk(filteredCards, 3)"
        :key="index"
        class="flex space-x-3 mb-4"
      >
      <div v-for="card in cardRow">
        <Card
          :tokenId="card.tokenId"
          :title="card.title"
          :description="card.description"
          :reward="card.reward"
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

