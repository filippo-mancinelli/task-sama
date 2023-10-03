<script setup>
import { getCurrentInstance, ref, watch, onMounted, defineEmits, nextTick } from 'vue';
import { useConnectionStore } from '../stores/useConnectionStore';
import { usePopupStore } from '../stores/usePopupStore';
import { PlayCircleIcon } from "@heroicons/vue/24/solid"

//TODO: txhash, address, like/dislike,
const emit = defineEmits(['like'])
const { ctx } = getCurrentInstance();
let isLikePlaying = false;

const props = defineProps([
  'tokenId',
  'title',
  'description',
  'rewardEarned',
  'creatorAddress',
  'winnerAddress',
  'ipfsUrl',
  'txhash',
  'likeCount',
  'isLiked'
]);

async function likeButton() {
  if(!isLikePlaying) { //prevents spamming like button
    if(useConnectionStore().isConnected) {
      playLikeAnimation();
      //the parent component (CardTables) listens for this event to take care of updating the DB and re-render  
      //this card component with updated data of likeCount and isLiked status props.
      emit('like', props.tokenId, !props.isLiked, useConnectionStore().walletAddress); 
    } else {
      usePopupStore().setPopup(true, 'alert', 'Connect your wallet before liking videos!', 'modal');
    }
  }
}

function playLikeAnimation(){
    if(props.isLiked) {
      ctx.$refs.lottiePlayer.seek("10%");
      isLikePlaying = false;
    } else {
      ctx.$refs.lottiePlayer.play();
      isLikePlaying = true;
      setTimeout(function(){
          ctx.$refs.lottiePlayer.pause();
          ctx.$refs.lottiePlayer.seek("70%");
          isLikePlaying = false;
      },1300);
    }
}


//##### video player #####//
const videoPlayer = ref(null);
const showControls = ref(false);

async function fetchIPFSVideo() {
  console.log(props.ipfsUrl)
  const response = await fetch(props.ipfsUrl);
  const blob = await response.blob();
  videoPlayer.value.src = URL.createObjectURL(blob);
}


onMounted(async () => {
  fetchIPFSVideo();

  //execute it the first time and then keep watching for user connection state to enable/disable like button
  setTimeout(function(){props.isLiked==true ? ctx.$refs.lottiePlayer.seek("70%") : ctx.$refs.lottiePlayer.seek("10%")}, 300)
  watch(() => useConnectionStore().isConnected, (newValue, oldValue) => {
    setTimeout(function(){props.isLiked==true ? ctx.$refs.lottiePlayer.seek("70%") : ctx.$refs.lottiePlayer.seek("10%")}, 300)
  });
});

</script>

<template>
<div class="card w-96 bg-base-100 shadow-xl border-2 border-black">
  <!-- video player -->
  <div class="video-container" @mouseenter="showControls = true" @mouseleave="showControls = false">
    <div class="video-wrapper">
      <video ref="videoPlayer" :class="{ 'show-controls': showControls }" controls autoplay class="video-player rounded-t-2xl"></video>
    </div>
  </div>

  <div class="card-body gap-1 p-5">
    <h2 class="card-title">
      {{ title }}   #{{ tokenId  }}
      <div class="badge badge-secondary">NEW</div>
    </h2>
    <p>{{ description }}</p>
    <div class="flex-container"> 
      <p class="italic truncate">Creator:  <span class="pl-1 text-xs">{{ creatorAddress }}</span></p>
      <p class="italic truncate">Winner:  <span class="pl-1 text-xs">{{ winnerAddress }}</span></p> 
      <p class="italic">Reward earned:  <span class="pl-1 text-lg">{{ rewardEarned }} GLMR</span></p> 
      <div class="flex items-center justify-end pt-3">
        <router-link :to="'/video/' + props.tokenId" class="btn absolute left-4 btn-primary text-white bg-orange-400 border-orange-400 hover:bg-orange-600 hover:border-black ">
          watch
          <PlayCircleIcon class="h-6 w-6 hover:cursor-pointer" /> 
        </router-link>
        <lottie-player class="relative h-8 resize left-4 bottom-0.5 align-top" ref="lottiePlayer" src="src/assets/like.json" mode="bounce" background="transparent" speed="2"  style="width: 90px; height: 90px;"></lottie-player>
        <div class="absolute hover:cursor-pointer h-7 w-7 mr-9"  @click="likeButton"></div> <!-- hitbox for click -->
        <span>{{ likeCount }}</span>
      </div>
    </div>
  </div>
</div>
</template>

<style scoped>
.resize {
  transform: scale(3);
}

.video-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}
.video-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background-color: rgb(255, 255, 255); /* Optional: Add a background color to fill the empty space */
  border-top-left-radius: 1rem; /* 16px */
  border-top-right-radius: 1rem; /* 16px */
}

.video-player {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}


/* Hide video controls by default */
video::-webkit-media-controls {
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* Show video controls on hover */
.video-container:hover video::-webkit-media-controls {
  opacity: 1;
}

.show-controls::-webkit-media-controls {
  opacity: 1;
  transition: opacity 0.3s ease;
}

.show-controls:not(:hover)::-webkit-media-controls {
  opacity: 0;
}
</style>
