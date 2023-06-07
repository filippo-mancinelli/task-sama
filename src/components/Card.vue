<script setup>
import { getCurrentInstance, ref, watch, onMounted } from 'vue';
import { useVideoStore } from '../stores/useVideoStore';
import { useConnectionStore } from '../stores/useConnectionStore';
import { storeToRefs } from 'pinia';
import { usePopupStore } from '../stores/usePopupStore';

//TODO: txhash, address, like/dislike,
const { like: updatelike } = useVideoStore();
const { totalLikesPerVideo } = storeToRefs(useVideoStore());
const { ctx } = getCurrentInstance();

const props = defineProps([
  'tokenId',
  'title',
  'description',
  'reward',
  'creatorAddress',
  'winnerAddress',
  'txhash'
]);

const like = ref(false);
const likeCount = ref(0)

async function likeButton() {
  if(useConnectionStore().isConnected) {
    playLikeAnimation();
    like.value = !like.value;
    likeCount.value = await updatelike(props.tokenId, like.value, useConnectionStore().walletAddress)
  } else {
    usePopupStore().setPopup(true, 'alert', 'Connect your wallet before liking videos!');
  }
}

function playLikeAnimation(){
  if(like.value) {
     ctx.$refs.lottiePlayer.stop();
  } else {
    ctx.$refs.lottiePlayer.seek("20%") 
    ctx.$refs.lottiePlayer.play();
    setTimeout(function(){
      ctx.$refs.lottiePlayer.pause() 
      like.value==true ? ctx.$refs.lottiePlayer.seek("70%") : ctx.$refs.lottiePlayer.seek("10%")
    },1300)
  }
}

//check if the user is connected and then sets the mapping of likes he has on videos
function setLikesMapping() {
  useConnectionStore().checkConnection().then(res => { //res is the connected wallet address
    if(res !== null) {
      useVideoStore().initLikes(res).then(likedVideoMapping => {
        if(likedVideoMapping.get(props.tokenId) == true) {
            like.value = true;
            ctx.$refs.lottiePlayer.seek("70%");
        } else {
          like.value = false;
          ctx.$refs.lottiePlayer.seek("10%");
        }
      });
    } else {
        useVideoStore().initLikes(null);
        like.value = false;
        ctx.$refs.lottiePlayer.seek("10%");
    }
  });
}

onMounted(() => {
  //we must watch for changes in the totalLikesPerVideo mapping BEFORE we make the call to the backend 
  watch(() => totalLikesPerVideo.value, (newValue, oldValue) => {
    likeCount.value = totalLikesPerVideo.value.get(props.tokenId);
  }, { deep: true });

  setLikesMapping();

  watch(() => useConnectionStore().isConnected, (newValue, oldValue) => {
    setLikesMapping();
  });
});

</script>

<template>
<div class="card w-96 bg-base-100 shadow-xl border-2 border-black">
  <figure><img src="https://cdnb.artstation.com/p/assets/covers/images/025/161/603/large/swan-dee-abstract-landscpe-9000-resize.jpg?1584855427" alt="Shoes" /></figure>
  <div class="card-body gap-1 p-5">
    <h2 class="card-title">
      {{ title }}   #{{ tokenId  }}
      <div class="badge badge-secondary">NEW</div>
    </h2>
    <p>{{ description }}</p>
    <div class="flex  items-center"> 
      <p class="italic">Reward earned:  <span class="pl-1 text-lg">{{ reward }} GLMR</span></p> 
      <lottie-player class="relative h-8 resize left-4 bottom-0.5 align-top hover:cursor-pointer" ref="lottiePlayer" src="src/assets/like.json" mode="bounce" background="transparent" speed="2"  style="width: 90px; height: 90px;" @click="likeButton"></lottie-player>
      <span>{{ likeCount }}</span>
    </div>
  </div>
</div>
</template>

<style scoped>
.resize {
  transform: scale(3);
}
</style>