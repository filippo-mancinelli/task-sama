<script setup>
import { getCurrentInstance, ref } from 'vue';


//TODO: txhash, address, like/dislike,
const { ctx } = getCurrentInstance();
const like = ref(false); //todo
const props = defineProps([
  'id',
  'title',
  'description',
  'reward',
  'creatorAddress',
  'winnerAddress',
  'txhash',
  'likeCount'
]);


function likeButton() {
  playLikeAnimation();
  like.value = !like.value;
}

function playLikeAnimation(){
  if(like.value){
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

</script>

<template>
<div class="card w-96 bg-base-100 shadow-xl border-2 border-black">
  <figure><img src="https://cdnb.artstation.com/p/assets/covers/images/025/161/603/large/swan-dee-abstract-landscpe-9000-resize.jpg?1584855427" alt="Shoes" /></figure>
  <div class="card-body gap-1 p-5">
    <h2 class="card-title">
      {{ title }}   #{{ id  }}
      <div class="badge badge-secondary">NEW</div>
    </h2>
    <p>{{ description }}</p>
    <div class="flex  items-center"> 
      <p class="italic">Reward earned:  <span class="pl-1 text-lg">{{ reward }} GLMR</span></p> 
      <lottie-player class="relative h-8 resize left-4 bottom-0.5 align-top hover:cursor-pointer" ref="lottiePlayer" src="src/assets/like.json" mode="bounce" background="transparent" speed="2"  style="width: 90px; height: 90px;" @click="likeButton"></lottie-player>
      <span>345</span>
    </div>
  </div>
</div>
</template>

<style scoped>
.resize {
  transform: scale(3);
}
</style>