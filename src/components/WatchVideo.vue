<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router'
import { useConnectionStore } from '../stores/useConnectionStore';
import { useVideoStore } from '../stores/useVideoStore';
import { useBackgroundStore } from '../stores/useBackgroundStore';
import { usePopupStore } from '../stores/usePopupStore';

const backgroundStore = useBackgroundStore();
const connectionStore = useConnectionStore();
const videoStore = useVideoStore();
const popupStore = usePopupStore();

backgroundStore.changeBackgroundClass('bg-background-image h-screen');

let route;
var tokenId;
const tasksamaObject = ref({});
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
    tasksamaObject.value = await videoStore.fetchTasksamaMetadata(1);
    console.log("tasksamaObject.value", tasksamaObject.value)
    isReady.value = true;
    fetchIPFSVideo();
})
</script>

<template>
<div class="card lg:card-side bg-base-100 shadow-xl mx-12 my-6">
  <!--VIDEO PLAYER-->
  <div class="video-container" @mouseenter="showControls = true" @mouseleave="showControls = false">
    <div class="video-wrapper">
      <video ref="videoPlayer" :class="{ 'show-controls': showControls }" controls autoplay class="video-player rounded-t-2xl"></video>
    </div>
  </div>

  <!--CARD BODY-->
  <div class="card-body">
    <h2 class="card-title">New album is released!</h2>
    <p>Click the button to listen on Spotiwhy app.</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Listen</button>
    </div>
  </div>
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