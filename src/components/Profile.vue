<script setup>
import CardTable from './CardTable.vue';
</script>

<template>
<div class="h-screen">
    <div class="tabs flex justify-center items-center ">
        <a class="tab tab-lg tab-lifted">Tasks listed</a> 
        <a class="tab tab-lg tab-lifted tab-active">Tasks participated</a> 
        <a class="tab tab-lg tab-lifted">Tasks won</a>
    </div>

    <CardTable />
</div>


</template>