<script setup>
import { ref, computed, onMounted, defineProps, onBeforeUnmount, watch } from 'vue';
import { useVideoStore } from '../stores/useVideoStore';
import { useConnectionStore } from '../stores/useConnectionStore';
import { storeToRefs } from 'pinia';
import Card from './Card.vue';
import _ from 'lodash';

const videoStore = useVideoStore();
const connectionStore = useConnectionStore();
const { videoMetadata: cards } = storeToRefs(videoStore);

const searchQuery = ref("");
const sortOrder = ref("id");
const sortDirection = ref("asc");
const currentPage = ref(1);
const visibleCardsNumber = ref(9);

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

    if (sortOrder.value === "tokenId") {
        results = _.orderBy(results, ["tokenId"], [sortDirection.value]);
    } else if (sortOrder.value === "rewardEarned") {
        results = _.orderBy(results, ["rewardEarned"], [sortDirection.value]);
    }

    const startIndex = (currentPage.value - 1) * visibleCardsNumber.value;
    const endIndex = startIndex + visibleCardsNumber.value;
    return results.slice(startIndex, endIndex);;
});

const sortCards = () => {
    if (sortOrder.value === "tokenId") {
      cards.value = _.orderBy(cards.value, ["tokenId"], [sortDirection.value]);
    } else if (sortOrder.value === "rewardEarned") {
      cards.value = _.orderBy(cards.value, ["rewardEarned"], [sortDirection.value]);
    }
};

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
};

//###### card columns ######//
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
  const totalPages = Math.ceil(cards.value.length / 9);
  if (currentPage.value < totalPages) {
    currentPage.value++;
  }
}


//####### LIKES ########
const { like: updatelike } = useVideoStore();

// We are using computed properties to make the card Like count reactive, because using a normal call function in the template won't cause a re-render of the component.
// Look into https://vuejs.org/guide/essentials/computed.html#basic-example
const getCurrentLikeCount = computed(() => (tokenId) => {
  if(videoStore.likesMetadata != null && videoStore.likesMetadata != undefined) {
    if(videoStore.likesMetadata.size > 0) {
      return videoStore.likesMetadata.get(tokenId).likeCount;
    }
  }
}); 

const getCurrentIsLiked = computed(() => (tokenId) => {
  if(videoStore.likesMetadata != null && videoStore.likesMetadata != undefined) {
    if(videoStore.likesMetadata.size > 0)
      return videoStore.likesMetadata.get(tokenId).isLiked;
  }
});

async function like(tokenId, likeValue, walletAddress) {
    cards.value.find(element => element.tokenId === tokenId).likeCount = await updatelike(tokenId, likeValue, walletAddress); //updateLike takes care of updating likesMetadata store values
    videoStore.likesMetadata.get(tokenId).isLiked = likeValue;
}


//Define callback function for event listeners for updating columns on screen resize 
const resizeEventListener = function(event){
  screenSizeColumns.value = calculateColumnNumber();
};

async function refreshMetadata() {
  cards.value = await videoStore.initVideoMetadata();  //fetch videos metadata on-chain
  videoStore.likesMetadata = await videoStore.initLikes(connectionStore.walletAddress ? connectionStore.walletAddress : null); // Fetch likes metadata from backend. If we pass "null", the backend will respond with the like count but with isLiked false for every video
  if(cards.value.length > 0 && videoStore.likesMetadata.size > 0) videoStore.isDataReady = true;
} 

onMounted(async () => {
  refreshMetadata();

  watch([() => connectionStore.isConnected, () => connectionStore.walletAddress], async () => {
    refreshMetadata();
  });

  window.addEventListener('resize', resizeEventListener);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeEventListener);
});

</script>

<template>
  <div id="cards" class="my-10 content-center">
    <p class="text-center text-5xl font-extrabold text-black drop-shadow-lg drop-shadow-orange-500">Tasks completed</p>
  </div>

  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-40 my-4">
    <input type="text" v-model="searchQuery" class="w-full py-2 px-3  mb-2 sm:mb-0 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" placeholder="Search tasks...">
    <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
      <select v-model="sortOrder" @change="sortCards" class="px-4 py-2 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent">
        <option value="tokenId" class="hover:bg-orange-200">Sort by ID</option>
        <option value="rewardEarned">Sort by Reward</option>
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
    <div v-for="(cardRow, index) in _.chunk(filteredCards, screenSizeColumns)" :key="index" class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
      <div v-for="card in cardRow" :key="card.tokenId">
        <Card
          :tokenId="card.tokenId"
          :title="card.title"
          :description="card.description"
          :rewardEarned="card.rewardEarned"
          :creatorAddress="card.creator"
          :winnerAddress="card.winner"
          :ipfsVideoUrl="card.ipfsVideoUrl"
          :txhash="TODO"
          :likeCount="getCurrentLikeCount(card.tokenId)"
          :isLiked="getCurrentIsLiked(card.tokenId)"
          :timestamp="card.timestamp"
          @like="(tokenId, likeValue, walletAddress) => like(tokenId, likeValue, walletAddress)"
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


