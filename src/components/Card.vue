<script setup>
import { HandRaisedIcon } from '@heroicons/vue/24/solid';

//props are not reactive by default, if you need to make them reactive you need to "copy" these props into a reactive/computed object.
const props = defineProps([
  'id',
  'title',
  'description',
  'reward'
]);

</script>

<template>
<div class="card w-96 bg-base-100 shadow-xl border-2 border-black">
  <figure><img src="https://cdnb.artstation.com/p/assets/covers/images/025/161/603/large/swan-dee-abstract-landscpe-9000-resize.jpg?1584855427" alt="Shoes" /></figure>
  <div class="card-body">
    <h2 class="card-title">
      {{ title }}   #{{ id  }}
      <div class="badge badge-secondary">NEW</div>
    </h2>
    <p>{{ description }}</p>
    <div class="card-actions ">
      <div class="badge badge-outline py-6 pr-4 text-lg">Reward:    <span class="pl-2 text-lg">{{ reward }} GLMR</span></div> 
      <div class="">
        <label @click="openModal" class="btn btn-primary w-30 bg-orange-400 border-1 border-black hover:bg-orange-600 hover:border-black ">
        Participate
        <HandRaisedIcon class="h-6 w-6 pl-2 " />
      </label>
      </div>
    </div>
  </div>
</div>
</template>

<style scoped>
</style>