<script>
import Task from './Task.vue';
</script>

<template>
  <div id="cards" class="my-8 content-center">
    <p class="text-center text-4xl font-bold text-black drop-shadow-lg drop-shadow-orange-500">Choose a winner 🏆</p>
  </div>

  <Task
    :tokenId="task.tokenId"
    :title="task.title"
    :description="task.description"
    :reward="task.reward"
    :participants="task.participants"
    :isParticipanting="task.isParticipanting"
    @sentParticipation="() => refreshTasksMetadata()"
    class="bg-white text-black"
    />
</template>

<style>
</style>