<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router'
import { useCommentsStore } from '../stores/useCommentsStore';
import { useVideoStore } from '../stores/useVideoStore';
import { useBackgroundStore } from '../stores/useBackgroundStore';
import CommentSection from './CommentSection.vue';

const backgroundStore = useBackgroundStore();
const commentsStore = useCommentsStore();
const videoStore = useVideoStore();

backgroundStore.changeBackgroundClass('bg-background-image h-screen');

let route;
var tokenId;
const tasksamaObject = ref({});
const comments = ref([]);
const isReady = ref(false);

//##### video player #####//
const videoPlayer = ref(null);
const showControls = ref(false);

async function fetchIPFSVideo() {
  const gateways = ['https://ipfs.io/', 'https://cloudflare-ipfs.com/'];
  let selectedGateway = '';

  for (const gateway of gateways) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const checkAvailability = await fetch(gateway, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeoutId);

      if (checkAvailability.ok) {
        selectedGateway = gateway;
        break;
      }
    } catch (error) {
      console.error(`Error checking ${gateway}:`, error);
    }
  }

  if (selectedGateway) {
    const finalUrl = selectedGateway + tasksamaObject.value.ipfsVideoUrl;
    try {
      const response = await fetch(finalUrl);
      const blob = await response.blob();
      videoPlayer.value.src = URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error fetching video:', error);
    }
  } else {
    console.error('No available IPFS gateway');
  }
}

onMounted(async () => {
    route = useRoute();
    tokenId = route.params.tokenId;
    tasksamaObject.value = await videoStore.fetchTasksamaMetadata(tokenId);
    comments.value = await commentsStore.getComments(tokenId);
    isReady.value = true;
    fetchIPFSVideo();
});
</script>

<template>
<div class="card lg:card-side bg-base-100 shadow-xl mx-12 my-6">
  <!--VIDEO PLAYER-->
  <div class="video-container max-w-xl" @mouseenter="showControls = true" @mouseleave="showControls = false">
    <div class="video-wrapper">
      <video ref="videoPlayer" :class="{ 'show-controls': showControls }" controls autoplay class="video-player rounded-t-2xl"></video>
    </div>
  </div>

  <!--CARD BODY-->
  <div class="card-body">
    <h2 class="card-title">New album is released!</h2>
    <div>
      <p class="italic text-xs -mt-2">{{ tasksamaObject.timestamp }}</p>
      <p>{{ tasksamaObject.description }}</p>
    </div>

  </div>
</div>

<!--COMMENT SECTION-->
<div class="mx-12 my-6">
  <CommentSection 
    :tokenId="tokenId"
    :comments-array="comments"
  />
</div>

</template>

<style>
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