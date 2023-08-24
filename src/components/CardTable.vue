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

//###### card columns ######//
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

//####### LIKES ########
const { like: updatelike } = useVideoStore();

// We are using computed properties to make the card Like count reactive, because using a normal call function in the template won't cause a re-render of the component.
// Look into https://vuejs.org/guide/essentials/computed.html#basic-example
const getCurrentLikeCount = computed(() => (tokenId) => {
  if(videoStore.likesMetadata != null && videoStore.likesMetadata != undefined) {
    return videoStore.likesMetadata.get(tokenId).likeCount;
  }
}); 

const getCurrentIsLiked = computed(() => (tokenId) => {
  if(videoStore.likesMetadata != null && videoStore.likesMetadata != undefined) {
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

onMounted(async () => {
  //fetch videos metadata on-chain
  watch(() => connectionStore.tasksamaInstance, async (instance) => {
    if(instance != null) {
      cards.value = await videoStore.initVideoMetadata(); 
    }
  });

  //every wallet change we update the mapping of which videos the new wallet liked 
  watch(() => connectionStore.walletAddress, async (walletAddress) => {
    videoStore.likesMetadata = await videoStore.initLikes(walletAddress ? walletAddress : undefined);
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
    <input type="text" v-model="searchQuery" class="w-full py-2 px-3  mb-2 sm:mb-0 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" placeholder="Search cards...">
    <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
      <select v-model="sortOrder" @change="sortCards" class="px-4 py-2 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent">
        <option value="id" class="hover:bg-orange-200">Sort by ID</option>
        <option value="reward">Sort by Reward</option>
      </select>
      <button @click="toggleSortDirection" class="px-4 py-2 text-gray-700 bg-white border border-orange-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent">
        {{ sortDirection === 'asc' ? 'Ascending' : 'Descending'}}
      </button>
    </div>
  </div>

  <div class="card-table px-4 sm:px-40 mt-10">
    <div v-for="(cardRow, index) in _.chunk(filteredCards, screenSizeColumns)" :key="index" class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
      <div v-for="card in cardRow" :key="card.tokenId" class="w-full">
        <Card
          :tokenId="card.tokenId"
          :title="card.title"
          :description="card.description"
          :rewardEarned="card.rewardEarned"
          :creatorAddress="card.creator"
          :winnerAddress="card.winner"
          :ipfsUrl="card.ipfsUrl"
          :txhash="TODO"
          :likeCount="getCurrentLikeCount(card.tokenId)"
          :isLiked="getCurrentIsLiked(card.tokenId)"
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
  .card-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  option:hover {
    background-color: #ffbb55;
  }
</style>


