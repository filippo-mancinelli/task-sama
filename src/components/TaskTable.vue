<script setup>
import { ref, computed } from 'vue';
import _ from 'lodash';
import Card from './Card.vue';

// Sample card data
const cards = ref([
    // Add card objects here with properties like id, title, description, and price
    { id: 1, title: "Card 1", description: "Description 1", price: 10 },
    { id: 2, title: "Card 2", description: "Description 2", price: 20 },
    { id: 3, title: "Card 3", description: "Description 3", price: 30 },
    { id: 4, title: "Card 4", description: "Description 4", price: 40 },
    { id: 5, title: "Card 5", description: "Description 5", price: 50 },

    // Add more cards
]);

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
    } else if (sortOrder.value === "price") {
        results = _.orderBy(results, ["price"], [sortDirection.value]);
    }

    return results;
});

const sortCards = () => {
    if (sortOrder.value === "id") {
      cards.value = _.orderBy(cards.value, ["id"], [sortDirection.value]);
    } else if (sortOrder.value === "price") {
      cards.value = _.orderBy(cards.value, ["price"], [sortDirection.value]);
    }
};

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";

};

</script>

<template>
<div id="tasks" class="my-10 content-center">
  <p class="text-center text-6xl font-extrabold text-black drop-shadow-lg drop-shadow-orange-500">Tasks</p>
</div>

    <div class="flex items-center px-40 space-x-2 mt-10">
      <input type="text" v-model="searchQuery" class="w-full py-2 pl-3 pr-10 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" placeholder="Search cards...">
      <select v-model="sortOrder" @change="sortCards" class="px-4 py-2 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent">
          <option value="id" class="hover:bg-orange-200">Sort by ID</option>
          <option value="price">Sort by Price</option>
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
          :id="card.id"
          :title="card.title"
          :description="card.description"
          :price="card.price"
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

