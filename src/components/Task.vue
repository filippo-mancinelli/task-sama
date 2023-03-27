<script setup>
import internal from 'stream';
import { reactive } from 'vue';

//props are not reactive by default, if you need to make them reactive you need to "copy" these props into a reactive/computed object.
const props = defineProps([
  'id',
  'title',
  'description',
  'price'
]);

</script>

<template>
<div class="card w-96 bg-base-100 shadow-xl border-2 border-black">
  <figure><img src="https://cdnb.artstation.com/p/assets/covers/images/025/161/603/large/swan-dee-abstract-landscpe-9000-resize.jpg?1584855427" alt="Shoes" /></figure>
  <div class="card-body">
    <h2 class="card-title">
      {{ props?.title }}   #{{ props?.id  }}
      <div class="badge badge-secondary">NEW</div>
    </h2>
    <p>{{ props?.description }}</p>
    <div class="card-actions justify-end">
      <div class="badge badge-outline">Price: {{ props?.pri }}</div> 
      <div class="badge badge-outline">Products</div>
    </div>
  </div>
</div>
</template>

<style scoped>
</style>