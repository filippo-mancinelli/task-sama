<script setup>
import Hero from './Hero.vue';
import CardTable from './CardTable.vue';
import TaskTable from './TaskTable.vue';
import { useBackgroundStore } from '../stores/useBackgroundStore';

const backgroundStore = useBackgroundStore();
backgroundStore.changeBackgroundClass('bg-background-image');


</script>

<template>
<div class="">
    <Hero />
    <CardTable />
    <TaskTable />
</div>

</template>

<style scoped>

</style>

